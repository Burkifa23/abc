// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CivicElection} from "../src/CivicElection.sol";
import {ClubAccess} from "../src/ClubAccess.sol";
import {Tender} from "../src/Tender.sol";
import {LandRegistry} from "../src/LandRegistry.sol";
import {ERC721Minimal} from "../src/ERC721Minimal.sol";
import {ICivicElection} from "../src/interfaces/ICivicElection.sol";
import {IClubAccess} from "../src/interfaces/IClubAccess.sol";
import {ITender} from "../src/interfaces/ITender.sol";
import {ILandRegistry} from "../src/interfaces/ILandRegistry.sol";
import {IERC721Receiver} from "../src/interfaces/IERC721Receiver.sol";

/// Accepts safe transfers.
contract GoodReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

/// Has no receiver hook at all.
contract BadReceiver {
    function hello() external pure returns (uint256) {
        return 1;
    }
}

/// Has the hook but answers with the wrong selector.
contract WrongAnswerReceiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return 0xdeadbeef;
    }
}

/// Conformance tests: the same behaviour as labs 08, 11, 16 and 17, checked through the interfaces.
contract ConformanceTest is Test {
    address admin = makeAddr("admin");
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");
    address yaw = makeAddr("yaw");
    address mallory = makeAddr("mallory");

    uint256 constant BUDGET = 10 ether;
    uint256 constant BOND = 0.1 ether;
    bytes32 constant SALT = keccak256("salt");

    // ---------------------------------------------------------------- elections

    function _election() internal returns (ICivicElection e) {
        string[] memory names = new string[](3);
        names[0] = "Ama";
        names[1] = "Kofi";
        names[2] = "Esi";
        vm.prank(admin);
        e = ICivicElection(address(new CivicElection(names)));
    }

    function test_01_ElectionLifecycle() public {
        ICivicElection e = _election();
        assertEq(e.admin(), admin);
        assertEq(e.candidateCount(), 3);
        (string memory name, uint256 count) = e.candidates(1);
        assertEq(name, "Kofi");
        assertEq(count, 0);

        vm.startPrank(admin);
        e.registerVoter(ama);
        e.registerVoter(kofi);
        e.registerVoter(esi);
        vm.stopPrank();
        assertTrue(e.isRegistered(ama));
        assertFalse(e.isRegistered(yaw));

        vm.expectEmit(true, true, false, false);
        emit ICivicElection.Voted(ama, 1);
        vm.prank(ama);
        e.vote(1);
        vm.prank(kofi);
        e.vote(1);
        vm.prank(esi);
        e.vote(2);
        assertTrue(e.hasVoted(ama));
        assertFalse(e.hasVoted(yaw));
        (, count) = e.candidates(1);
        assertEq(count, 2);
        assertEq(e.winner(), "Kofi");
    }

    function test_02_ElectionGuards() public {
        ICivicElection e = _election();
        vm.expectRevert(ICivicElection.NotAdmin.selector);
        vm.prank(ama);
        e.registerVoter(ama);

        vm.prank(admin);
        e.registerVoter(ama);
        vm.expectRevert(ICivicElection.NotRegistered.selector);
        vm.prank(kofi);
        e.vote(0);
        vm.expectRevert(ICivicElection.InvalidCandidate.selector);
        vm.prank(ama);
        e.vote(3);
        vm.prank(ama);
        e.vote(2);
        vm.expectRevert(ICivicElection.AlreadyVoted.selector);
        vm.prank(ama);
        e.vote(2);
        // a tie goes to the lower id
        vm.prank(admin);
        e.registerVoter(kofi);
        vm.prank(kofi);
        e.vote(0);
        assertEq(e.winner(), "Ama");
    }

    // ------------------------------------------------------------------- access

    function _access() internal returns (IClubAccess a) {
        vm.prank(admin);
        a = IClubAccess(address(new ClubAccess()));
    }

    function test_03_AccessLifecycle() public {
        IClubAccess a = _access();
        bytes32 secret = keccak256("ama's secret");
        bytes32 commitment = a.commitmentOf(secret);
        assertEq(commitment, keccak256(abi.encodePacked(secret)));
        assertEq(a.sealFor(ama, secret), keccak256(abi.encodePacked(ama, secret)));
        assertEq(a.admin(), admin);

        vm.expectEmit(true, false, false, false);
        emit IClubAccess.MemberAdded(commitment);
        vm.prank(admin);
        a.addMember(commitment);
        assertTrue(a.isMember(commitment));

        bytes32 seal = a.sealFor(ama, secret);
        vm.prank(ama);
        a.commitEntry(seal);
        assertEq(a.sealedEntry(ama), seal);
        assertEq(a.committedAt(ama), block.number);

        vm.roll(block.number + 1);
        vm.prank(ama);
        a.enter(secret);
        assertTrue(a.hasAccess(ama));
        assertTrue(a.used(commitment));
        assertEq(a.sealedEntry(ama), bytes32(0));
    }

    function test_04_AccessGuards() public {
        IClubAccess a = _access();
        bytes32 secret = keccak256("ama's secret");
        bytes32 commitment = a.commitmentOf(secret);

        vm.expectRevert(IClubAccess.NotAdmin.selector);
        vm.prank(mallory);
        a.addMember(commitment);
        vm.expectRevert(IClubAccess.NotAdmin.selector);
        vm.prank(mallory);
        a.revokeMember(commitment);

        vm.prank(admin);
        a.addMember(commitment);

        // no commit yet
        vm.expectRevert(IClubAccess.NoPendingEntry.selector);
        vm.prank(ama);
        a.enter(secret);

        // front-run: mallory commits to the same secret, ama is first to reveal
        vm.prank(ama);
        a.commitEntry(a.sealFor(ama, secret));
        vm.prank(mallory);
        a.commitEntry(a.sealFor(mallory, secret));

        // the same block is too early
        vm.expectRevert(IClubAccess.RevealTooEarly.selector);
        vm.prank(ama);
        a.enter(secret);

        vm.roll(block.number + 1);
        vm.expectRevert(IClubAccess.SealMismatch.selector);
        vm.prank(ama);
        a.enter(keccak256("wrong"));

        vm.prank(ama);
        a.enter(secret);

        // reuse: the secret is spent
        vm.expectRevert(IClubAccess.AlreadyUsed.selector);
        vm.prank(mallory);
        a.enter(secret);

        // revoke: a revoked member cannot enter
        vm.prank(admin);
        a.revokeMember(commitment);
        vm.prank(kofi);
        a.commitEntry(a.sealFor(kofi, secret));
        vm.roll(block.number + 1);
        vm.expectRevert(IClubAccess.UnknownCommitment.selector);
        vm.prank(kofi);
        a.enter(secret);
    }

    // ------------------------------------------------------------------- tender

    function _tender() internal returns (ITender t) {
        vm.deal(admin, BUDGET);
        vm.prank(admin);
        t = ITender(address(new Tender{value: BUDGET}("Build the lab", 3 days, 2 days)));
    }

    function _seal(address who, uint256 price) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(who, price, SALT));
    }

    function _bid(ITender t, address who, uint256 price) internal {
        vm.deal(who, 1 ether);
        vm.prank(who);
        t.bid{value: BOND}(_seal(who, price));
    }

    function _reveal(ITender t, address who, uint256 price) internal {
        vm.prank(who);
        t.reveal(price, SALT);
    }

    function test_05_TenderLifecycle() public {
        ITender t = _tender();
        assertEq(t.agency(), admin);
        assertEq(t.budget(), BUDGET);
        assertEq(t.BOND(), BOND);
        assertEq(t.description(), "Build the lab");
        assertEq(uint256(t.phase()), uint256(ITender.Phase.Bidding));
        vm.prank(kofi);
        assertEq(t.sealBid(6 ether, SALT), _seal(kofi, 6 ether));

        _bid(t, kofi, 6 ether);
        _bid(t, esi, 8 ether);
        _bid(t, yaw, 7 ether);
        assertEq(t.sealedBids(kofi), _seal(kofi, 6 ether));

        vm.warp(t.biddingEnd());
        _reveal(t, kofi, 6 ether);
        _reveal(t, esi, 8 ether);
        assertTrue(t.revealed(kofi));
        assertFalse(t.revealed(yaw)); // yaw never reveals

        vm.warp(t.revealEnd());
        t.finalize();
        assertEq(uint256(t.phase()), uint256(ITender.Phase.Awarded));
        assertEq(t.winner(), kofi);
        assertEq(t.winningPrice(), 6 ether);
        assertEq(t.pendingWithdrawals(esi), BOND);

        vm.prank(admin);
        t.confirmDelivery();
        assertEq(uint256(t.phase()), uint256(ITender.Phase.Delivered));
        assertEq(t.pendingWithdrawals(kofi), 6 ether + BOND);

        address[3] memory everyone = [kofi, esi, admin];
        for (uint256 i = 0; i < everyone.length; i++) {
            vm.prank(everyone[i]);
            t.withdraw();
        }
        assertEq(address(t).balance, 0);
    }

    function test_06_TenderGuards() public {
        vm.expectRevert(ITender.ZeroBudget.selector);
        new Tender("Nothing", 1 days, 1 days);

        ITender t = _tender();
        vm.deal(kofi, 1 ether);
        bytes32 s = _seal(kofi, 6 ether);
        vm.expectRevert(ITender.WrongBond.selector);
        vm.prank(kofi);
        t.bid{value: BOND + 1}(s);
        _bid(t, kofi, 6 ether);
        vm.expectRevert(ITender.AlreadyBid.selector);
        vm.prank(kofi);
        t.bid{value: BOND}(s);
        _bid(t, esi, 12 ether); // over budget
        _bid(t, yaw, 7 ether); // never reveals

        // nobody can confirm or finalize yet
        vm.expectRevert(ITender.WrongPhase.selector);
        vm.prank(admin);
        t.confirmDelivery();
        vm.expectRevert(ITender.TooEarly.selector);
        _reveal(t, kofi, 6 ether);

        // boundaries: a bid at biddingEnd is late, a reveal at biddingEnd is fine
        vm.warp(t.biddingEnd());
        vm.deal(mallory, 1 ether);
        bytes32 late = _seal(mallory, 1 ether);
        vm.expectRevert(ITender.TooLate.selector);
        vm.prank(mallory);
        t.bid{value: BOND}(late);
        vm.expectRevert(ITender.NoBid.selector);
        _reveal(t, mallory, 1 ether);
        vm.expectRevert(ITender.BadReveal.selector);
        _reveal(t, kofi, 5 ether);
        _reveal(t, kofi, 6 ether);
        vm.expectRevert(ITender.AlreadyRevealed.selector);
        _reveal(t, kofi, 6 ether);
        _reveal(t, esi, 12 ether);

        vm.expectRevert(ITender.TooEarly.selector);
        t.finalize();
        vm.warp(t.revealEnd());
        vm.expectRevert(ITender.TooLate.selector);
        _reveal(t, yaw, 7 ether);
        t.finalize();
        vm.expectRevert(ITender.WrongPhase.selector);
        t.finalize();
        assertEq(t.winner(), kofi); // the over-budget bid could not win
        assertEq(t.pendingWithdrawals(esi), BOND);

        vm.expectRevert(ITender.NotAgency.selector);
        vm.prank(kofi);
        t.confirmDelivery();
        vm.expectRevert(ITender.NothingToWithdraw.selector);
        vm.prank(yaw);
        t.withdraw();

        // a tender nobody wins hands the whole budget back
        ITender t2 = _tender();
        _bid(t2, yaw, 5 ether);
        vm.warp(t2.revealEnd());
        t2.finalize();
        assertEq(uint256(t2.phase()), uint256(ITender.Phase.NoWinner));
        assertEq(t2.pendingWithdrawals(admin), BUDGET + BOND);
    }

    // --------------------------------------------------------------------- land

    function _land() internal returns (ILandRegistry l) {
        vm.prank(admin);
        l = ILandRegistry(address(new LandRegistry()));
    }

    function _register(ILandRegistry l, string memory region, uint256 number, address owner)
        internal
        returns (uint256)
    {
        vm.prank(admin);
        return l.register(region, number, 600, owner);
    }

    function test_07_LandLifecycle() public {
        ILandRegistry l = _land();
        assertEq(l.registrar(), admin);
        uint256 id = l.plotId("Accra", 12);
        assertEq(id, uint256(keccak256(abi.encode("Accra", uint256(12)))));

        vm.expectEmit(true, true, false, true);
        emit ILandRegistry.PlotRegistered(id, "Accra", 12, ama);
        assertEq(_register(l, "Accra", 12, ama), id);
        assertEq(l.ownerOf(id), ama);
        assertEq(l.balanceOf(ama), 1);
        ILandRegistry.Plot memory p = l.plot(id);
        assertEq(p.region, "Accra");
        assertEq(p.plotNumber, 12);
        assertEq(p.areaSqm, 600);
        assertFalse(p.disputed);

        // approvals and operators
        vm.prank(ama);
        l.approve(kofi, id);
        assertEq(l.getApproved(id), kofi);
        vm.prank(kofi);
        l.transferFrom(ama, kofi, id);
        assertEq(l.getApproved(id), address(0));
        vm.prank(kofi);
        l.setApprovalForAll(esi, true);
        assertTrue(l.isApprovedForAll(kofi, esi));
        vm.prank(esi);
        l.safeTransferFrom(kofi, esi, id); // to a plain wallet

        // safe transfers to contracts
        address good = address(new GoodReceiver());
        vm.prank(esi);
        l.safeTransferFrom(esi, good, id, "hi");
        assertEq(l.ownerOf(id), good);

        address[] memory h = l.ownershipHistory(id);
        assertEq(h.length, 4);
        assertEq(h[0], ama);
        assertEq(h[1], kofi);
        assertEq(h[2], esi);
        assertEq(h[3], good);
    }

    function test_08_LandGuards() public {
        ILandRegistry l = _land();
        uint256 id = _register(l, "Accra", 12, ama);

        vm.expectRevert(ILandRegistry.NotRegistrar.selector);
        vm.prank(ama);
        l.register("Accra", 13, 600, ama);
        vm.expectRevert(ILandRegistry.ZeroArea.selector);
        vm.prank(admin);
        l.register("Accra", 13, 0, ama);
        vm.expectRevert(abi.encodeWithSelector(ILandRegistry.AlreadyRegistered.selector, id));
        vm.prank(admin);
        l.register("Accra", 12, 600, kofi);
        vm.expectRevert(ERC721Minimal.ZeroAddress.selector);
        vm.prank(admin);
        l.register("Accra", 14, 600, address(0));

        // ordinary transfer rules
        vm.expectRevert(ERC721Minimal.NotAuthorized.selector);
        vm.prank(esi);
        l.transferFrom(ama, esi, id);
        vm.expectRevert(ERC721Minimal.NotAuthorized.selector);
        vm.prank(esi);
        l.approve(esi, id);
        vm.expectRevert(ERC721Minimal.WrongOwner.selector);
        vm.prank(ama);
        l.transferFrom(kofi, esi, id);
        vm.expectRevert(ERC721Minimal.ZeroAddress.selector);
        vm.prank(ama);
        l.transferFrom(ama, address(0), id);
        vm.expectRevert(ERC721Minimal.ZeroAddress.selector);
        l.balanceOf(address(0));
        vm.expectRevert(abi.encodeWithSelector(ERC721Minimal.NoSuchToken.selector, 5));
        l.ownerOf(5);

        // unsafe recipients
        address bad = address(new BadReceiver());
        address wrong = address(new WrongAnswerReceiver());
        vm.expectRevert(abi.encodeWithSelector(ERC721Minimal.UnsafeRecipient.selector, bad));
        vm.prank(ama);
        l.safeTransferFrom(ama, bad, id);
        vm.expectRevert(abi.encodeWithSelector(ERC721Minimal.UnsafeRecipient.selector, wrong));
        vm.prank(ama);
        l.safeTransferFrom(ama, wrong, id);

        // disputes freeze transfers, even for an approved operator
        vm.expectRevert(ILandRegistry.NotRegistrar.selector);
        vm.prank(ama);
        l.setDisputed(id, true);
        vm.prank(ama);
        l.approve(kofi, id);
        vm.expectEmit(true, false, false, true);
        emit ILandRegistry.DisputeSet(id, true);
        vm.prank(admin);
        l.setDisputed(id, true);
        vm.expectRevert(abi.encodeWithSelector(ILandRegistry.Disputed.selector, id));
        vm.prank(kofi);
        l.transferFrom(ama, kofi, id);

        // a court order moves it anyway and ends the dispute
        vm.expectRevert(ILandRegistry.NotRegistrar.selector);
        vm.prank(ama);
        l.courtOrderTransfer(id, ama);
        vm.expectEmit(true, true, true, false);
        emit ILandRegistry.CourtOrderTransfer(id, ama, esi);
        vm.prank(admin);
        l.courtOrderTransfer(id, esi);
        assertEq(l.ownerOf(id), esi);
        assertFalse(l.plot(id).disputed);
        assertEq(l.ownershipHistory(id).length, 2);

        // an undisputed plot can also be reassigned by court order
        vm.prank(admin);
        l.courtOrderTransfer(id, yaw);
        assertEq(l.ownerOf(id), yaw);

        // unknown plots
        uint256 nowhere = l.plotId("Nowhere", 1);
        bytes memory err = abi.encodeWithSelector(ILandRegistry.UnknownPlot.selector, nowhere);
        vm.expectRevert(err);
        l.plot(nowhere);
        vm.expectRevert(err);
        l.ownershipHistory(nowhere);
        vm.expectRevert(err);
        vm.prank(admin);
        l.setDisputed(nowhere, true);
        vm.expectRevert(err);
        vm.prank(admin);
        l.courtOrderTransfer(nowhere, kofi);
    }

    function test_09_SupportsInterfaces() public {
        ILandRegistry l = _land();
        assertTrue(l.supportsInterface(0x01ffc9a7)); // ERC-165
        assertTrue(l.supportsInterface(0x80ac58cd)); // ERC-721
        assertFalse(l.supportsInterface(0xffffffff));
    }
}
