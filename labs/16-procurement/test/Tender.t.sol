// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Tender} from "../src/Tender.sol";

contract TenderTest is Test {
    Tender tender;
    address agency = makeAddr("agency");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");
    address yaw = makeAddr("yaw");

    uint256 constant BUDGET = 10 ether;
    uint256 constant BOND = 0.1 ether;
    bytes32 constant SALT = keccak256("salt");

    event BidSubmitted(address indexed supplier);
    event BidRevealed(address indexed supplier, uint256 price);
    event Awarded(address indexed winner, uint256 price);
    event NoWinnerDeclared();
    event DeliveryConfirmed(address indexed winner, uint256 price);

    function setUp() public {
        vm.deal(agency, BUDGET);
        vm.prank(agency);
        tender = new Tender{value: BUDGET}("Build the science lab", 3 days, 2 days);
    }

    function _seal(address who, uint256 price, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(who, price, salt));
    }

    function _bid(address who, uint256 price) internal {
        vm.deal(who, 1 ether);
        vm.prank(who);
        tender.bid{value: BOND}(_seal(who, price, SALT));
    }

    function _reveal(address who, uint256 price) internal {
        vm.prank(who);
        tender.reveal(price, SALT);
    }

    function _toReveal() internal {
        vm.warp(tender.biddingEnd());
    }

    function _toEnd() internal {
        vm.warp(tender.revealEnd());
    }

    /// kofi bids 6, esi bids 8, yaw bids 7 and nobody is late: kofi wins.
    function _runToAward() internal {
        _bid(kofi, 6 ether);
        _bid(esi, 8 ether);
        _bid(yaw, 7 ether);
        _toReveal();
        _reveal(kofi, 6 ether);
        _reveal(esi, 8 ether);
        _reveal(yaw, 7 ether);
        _toEnd();
        tender.finalize();
    }

    // US1
    function test_US1_Open() public view {
        assertEq(address(tender).balance, BUDGET);
        assertEq(tender.agency(), agency);
        assertEq(tender.budget(), BUDGET);
        assertEq(tender.description(), "Build the science lab");
        assertEq(tender.biddingEnd(), block.timestamp + 3 days);
        assertEq(tender.revealEnd(), block.timestamp + 5 days);
        assertEq(uint256(tender.phase()), uint256(Tender.Phase.Bidding));
    }

    function test_US1_ZeroBudget() public {
        vm.expectRevert(Tender.ZeroBudget.selector);
        new Tender("Nothing", 1 days, 1 days);
    }

    // US2
    function test_US2_Bid() public {
        bytes32 s = _seal(kofi, 6 ether, SALT);
        assertEq(tender.sealBid(6 ether, SALT) == s, false); // msg.sender here is the test contract, not kofi
        vm.prank(kofi);
        assertEq(tender.sealBid(6 ether, SALT), s);

        vm.deal(kofi, 1 ether);
        vm.expectEmit(true, false, false, true);
        emit BidSubmitted(kofi);
        vm.prank(kofi);
        tender.bid{value: BOND}(s);
        assertEq(tender.sealedBids(kofi), s);
        assertEq(address(tender).balance, BUDGET + BOND);
    }

    function test_US2_WrongBond() public {
        vm.deal(kofi, 1 ether);
        bytes32 s = _seal(kofi, 6 ether, SALT);
        vm.startPrank(kofi);
        vm.expectRevert(Tender.WrongBond.selector);
        tender.bid{value: BOND - 1}(s);
        vm.expectRevert(Tender.WrongBond.selector);
        tender.bid{value: BOND + 1}(s);
        vm.stopPrank();
    }

    function test_US2_OneBidEach() public {
        _bid(kofi, 6 ether);
        vm.expectRevert(Tender.AlreadyBid.selector);
        vm.prank(kofi);
        tender.bid{value: BOND}(_seal(kofi, 5 ether, SALT));
    }

    function test_US2_BidAtBoundary() public {
        vm.warp(tender.biddingEnd() - 1);
        _bid(kofi, 6 ether); // the last second is still open
        vm.warp(tender.biddingEnd());
        vm.deal(esi, 1 ether);
        bytes32 s = _seal(esi, 5 ether, SALT);
        vm.expectRevert(Tender.TooLate.selector);
        vm.prank(esi);
        tender.bid{value: BOND}(s);
    }

    // US3
    function test_US3_Reveal() public {
        _bid(kofi, 6 ether);
        _toReveal();
        assertEq(uint256(tender.phase()), uint256(Tender.Phase.Reveal));
        vm.expectEmit(true, false, false, true);
        emit BidRevealed(kofi, 6 ether);
        _reveal(kofi, 6 ether);
        assertTrue(tender.revealed(kofi));
    }

    function test_US3_RevealBoundaries() public {
        _bid(kofi, 6 ether);
        _bid(esi, 7 ether);
        _bid(yaw, 5 ether);
        vm.warp(tender.biddingEnd() - 1);
        vm.expectRevert(Tender.TooEarly.selector);
        _reveal(kofi, 6 ether);

        vm.warp(tender.biddingEnd()); // exactly the end of bidding: reveal is allowed
        _reveal(kofi, 6 ether);

        vm.warp(tender.revealEnd() - 1);
        _reveal(esi, 7 ether); // the last second of the window

        vm.warp(tender.revealEnd()); // exactly the end of the reveal window: too late
        vm.expectRevert(Tender.TooLate.selector);
        _reveal(yaw, 5 ether);
    }

    function test_US3_BadRevealForfeits() public {
        _bid(kofi, 6 ether);
        _bid(esi, 8 ether);
        _toReveal();
        vm.expectRevert(Tender.BadReveal.selector);
        _reveal(esi, 1 ether); // wrong price
        vm.expectRevert(Tender.BadReveal.selector);
        vm.prank(esi);
        tender.reveal(8 ether, keccak256("other salt")); // wrong salt
        assertFalse(tender.revealed(esi));
        _reveal(kofi, 6 ether);
        _toEnd();
        tender.finalize();
        assertEq(tender.pendingWithdrawals(esi), 0);
        assertEq(tender.pendingWithdrawals(agency), BOND); // esi's bond is the penalty
    }

    function test_US3_DoubleReveal() public {
        _bid(kofi, 6 ether);
        _toReveal();
        _reveal(kofi, 6 ether);
        vm.expectRevert(Tender.AlreadyRevealed.selector);
        _reveal(kofi, 6 ether);
        vm.expectRevert(Tender.NoBid.selector);
        _reveal(esi, 6 ether);
    }

    // US4
    function test_US4_LowestWins() public {
        _runToAward();
        assertEq(tender.winner(), kofi);
        assertEq(tender.winningPrice(), 6 ether);
        assertEq(uint256(tender.phase()), uint256(Tender.Phase.Awarded));
        assertEq(tender.pendingWithdrawals(esi), BOND);
        assertEq(tender.pendingWithdrawals(yaw), BOND);
        assertEq(tender.pendingWithdrawals(kofi), 0); // the winner is paid on delivery
    }

    function test_US4_OverBudgetCannotWin() public {
        _bid(kofi, 12 ether); // above the 10 ether budget
        _bid(esi, 9 ether);
        _toReveal();
        _reveal(kofi, 12 ether);
        _reveal(esi, 9 ether);
        _toEnd();
        tender.finalize();
        assertEq(tender.winner(), esi);
        assertEq(tender.pendingWithdrawals(kofi), BOND);
    }

    function test_US4_TieEarlierReveal() public {
        _bid(kofi, 6 ether);
        _bid(esi, 6 ether);
        _toReveal();
        _reveal(esi, 6 ether); // esi reveals first, although kofi bid first
        _reveal(kofi, 6 ether);
        _toEnd();
        vm.expectEmit(true, false, false, true);
        emit Awarded(esi, 6 ether);
        tender.finalize();
        assertEq(tender.winner(), esi);
    }

    function test_US4_NoWinner() public {
        _bid(kofi, 11 ether); // over budget
        _bid(esi, 5 ether); // never reveals
        _toReveal();
        _reveal(kofi, 11 ether);
        _toEnd();
        vm.expectEmit(false, false, false, true);
        emit NoWinnerDeclared();
        tender.finalize();
        assertEq(uint256(tender.phase()), uint256(Tender.Phase.NoWinner));
        assertEq(tender.pendingWithdrawals(agency), BUDGET + BOND); // budget back plus esi's forfeited bond
        assertEq(tender.pendingWithdrawals(kofi), BOND);
        assertEq(tender.winner(), address(0));
    }

    function test_US4_FinalizeTooEarly() public {
        _bid(kofi, 6 ether);
        _toReveal();
        _reveal(kofi, 6 ether);
        vm.warp(tender.revealEnd() - 1);
        vm.expectRevert(Tender.TooEarly.selector);
        tender.finalize();
        vm.warp(tender.revealEnd());
        tender.finalize();
        vm.expectRevert(Tender.WrongPhase.selector); // not twice
        tender.finalize();
    }

    // US5
    function test_US5_ConfirmDelivery() public {
        _runToAward();
        vm.expectEmit(true, false, false, true);
        emit DeliveryConfirmed(kofi, 6 ether);
        vm.prank(agency);
        tender.confirmDelivery();
        assertEq(uint256(tender.phase()), uint256(Tender.Phase.Delivered));
        assertEq(tender.pendingWithdrawals(kofi), 6 ether + BOND);
        assertEq(tender.pendingWithdrawals(agency), 4 ether);
    }

    function test_US5_OnlyAgency() public {
        _runToAward();
        vm.expectRevert(Tender.NotAgency.selector);
        vm.prank(kofi);
        tender.confirmDelivery();
    }

    function test_US5_WrongPhase() public {
        _bid(kofi, 6 ether);
        vm.expectRevert(Tender.WrongPhase.selector); // still bidding
        vm.prank(agency);
        tender.confirmDelivery();

        _toReveal();
        _reveal(kofi, 6 ether);
        _toEnd();
        tender.finalize();
        vm.prank(agency);
        tender.confirmDelivery();
        vm.expectRevert(Tender.WrongPhase.selector); // not twice
        vm.prank(agency);
        tender.confirmDelivery();
    }

    // US6
    function test_US6_Withdraw() public {
        _runToAward();
        vm.prank(agency);
        tender.confirmDelivery();
        uint256 before = kofi.balance;
        vm.prank(kofi);
        tender.withdraw();
        assertEq(kofi.balance, before + 6 ether + BOND);
        assertEq(tender.pendingWithdrawals(kofi), 0);
    }

    function test_US6_NothingToWithdraw() public {
        vm.expectRevert(Tender.NothingToWithdraw.selector);
        vm.prank(kofi);
        tender.withdraw();
    }

    function test_US6_DrainsToZero() public {
        _bid(kofi, 6 ether);
        _bid(esi, 8 ether);
        _bid(yaw, 7 ether); // yaw never reveals
        _toReveal();
        _reveal(kofi, 6 ether);
        _reveal(esi, 8 ether);
        _toEnd();
        tender.finalize();
        vm.prank(agency);
        tender.confirmDelivery();
        address[3] memory everyone = [kofi, esi, agency];
        for (uint256 i = 0; i < everyone.length; i++) {
            vm.prank(everyone[i]);
            tender.withdraw();
        }
        assertEq(address(tender).balance, 0);
    }
}
