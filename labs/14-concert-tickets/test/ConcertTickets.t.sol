// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConcertTickets} from "../src/ConcertTickets.sol";
import {IERC721Receiver} from "../src/interfaces/IERC721Receiver.sol";

/// Accepts safe transfers by returning the magic selector.
contract GoodReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

/// Has no onERC721Received at all: safe transfers to it must fail.
contract BadReceiver {
    function hello() external pure returns (uint256) {
        return 1;
    }
}

contract ConcertTicketsTest is Test {
    ConcertTickets tix;
    address organizer = makeAddr("organizer");
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");
    address stranger = makeAddr("stranger");

    uint256 constant PRICE = 0.02 ether;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function setUp() public {
        vm.prank(organizer);
        tix = new ConcertTickets("ipfs://tix/");
    }

    function _buy(address who) internal returns (uint256 id) {
        vm.deal(who, 1 ether);
        vm.prank(who);
        id = tix.buyTicket{value: PRICE}();
    }

    function test_01_Metadata() public view {
        assertEq(tix.name(), "Ashesi Live");
        assertEq(tix.symbol(), "TIX");
        assertEq(tix.organizer(), organizer);
        assertEq(tix.MAX_SUPPLY(), 100);
        assertEq(tix.PRICE(), PRICE);
    }

    function test_02_SupportsInterfaces() public view {
        assertTrue(tix.supportsInterface(0x01ffc9a7)); // ERC-165
        assertTrue(tix.supportsInterface(0x80ac58cd)); // ERC-721
        assertTrue(tix.supportsInterface(0x5b5e139f)); // ERC-721 Metadata
        assertFalse(tix.supportsInterface(0xffffffff));
    }

    function test_03_BuyTicket() public {
        vm.deal(ama, 1 ether);
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), ama, 1);
        vm.prank(ama);
        uint256 id = tix.buyTicket{value: PRICE}();
        assertEq(id, 1);
        assertEq(tix.ownerOf(1), ama);
        assertEq(tix.balanceOf(ama), 1);
        assertEq(tix.totalMinted(), 1);
        assertEq(address(tix).balance, PRICE);
    }

    function test_04_WrongPrice() public {
        vm.deal(ama, 1 ether);
        vm.startPrank(ama);
        vm.expectRevert(ConcertTickets.WrongPrice.selector);
        tix.buyTicket{value: PRICE - 1}();
        vm.expectRevert(ConcertTickets.WrongPrice.selector);
        tix.buyTicket{value: PRICE + 1}();
        vm.stopPrank();
    }

    function test_05_SoldOut() public {
        vm.deal(ama, 1000 ether);
        vm.startPrank(ama);
        for (uint256 i = 0; i < 100; i++) {
            tix.buyTicket{value: PRICE}();
        }
        assertEq(tix.totalMinted(), 100);
        vm.expectRevert(ConcertTickets.SoldOut.selector);
        tix.buyTicket{value: PRICE}();
        vm.stopPrank();
    }

    function test_06_OwnerOfNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721NonexistentToken.selector, 7));
        tix.ownerOf(7);
    }

    function test_07_TransferFrom() public {
        uint256 id = _buy(ama);
        vm.expectEmit(true, true, true, true);
        emit Transfer(ama, kofi, id);
        vm.prank(ama);
        tix.transferFrom(ama, kofi, id);
        assertEq(tix.ownerOf(id), kofi);
        assertEq(tix.balanceOf(ama), 0);
        assertEq(tix.balanceOf(kofi), 1);
    }

    function test_07b_NotAllowed() public {
        uint256 id = _buy(ama);
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721InsufficientApproval.selector, stranger, id));
        vm.prank(stranger);
        tix.transferFrom(ama, stranger, id);

        // the "from" must really be the owner
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721IncorrectOwner.selector, kofi, id, ama));
        vm.prank(ama);
        tix.transferFrom(kofi, esi, id);

        // never to the zero address
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721InvalidReceiver.selector, address(0)));
        vm.prank(ama);
        tix.transferFrom(ama, address(0), id);
    }

    function test_08_Approve() public {
        uint256 id = _buy(ama);
        vm.expectEmit(true, true, true, true);
        emit Approval(ama, kofi, id);
        vm.prank(ama);
        tix.approve(kofi, id);
        assertEq(tix.getApproved(id), kofi);

        vm.prank(kofi);
        tix.transferFrom(ama, esi, id);
        assertEq(tix.ownerOf(id), esi);

        // a stranger cannot approve someone else's ticket
        uint256 id2 = _buy(ama);
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721InsufficientApproval.selector, stranger, id2));
        vm.prank(stranger);
        tix.approve(stranger, id2);
    }

    function test_08b_ApprovalCleared() public {
        uint256 id = _buy(ama);
        vm.prank(ama);
        tix.approve(kofi, id);
        vm.prank(ama);
        tix.transferFrom(ama, esi, id);
        assertEq(tix.getApproved(id), address(0));
        // kofi's old approval is gone
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721InsufficientApproval.selector, kofi, id));
        vm.prank(kofi);
        tix.transferFrom(esi, kofi, id);
    }

    function test_09_OperatorCanTransfer() public {
        uint256 id = _buy(ama);
        vm.expectEmit(true, true, false, true);
        emit ApprovalForAll(ama, kofi, true);
        vm.prank(ama);
        tix.setApprovalForAll(kofi, true);
        assertTrue(tix.isApprovedForAll(ama, kofi));

        // the operator may move the ticket and approve on the owner's behalf
        vm.prank(kofi);
        tix.approve(esi, id);
        vm.prank(kofi);
        tix.transferFrom(ama, kofi, id);
        assertEq(tix.ownerOf(id), kofi);

        // but approving an operator only ever touches the caller's own list
        vm.prank(kofi);
        tix.setApprovalForAll(stranger, true);
        assertFalse(tix.isApprovedForAll(ama, stranger));

        // and the owner can take the permission back
        vm.prank(ama);
        tix.setApprovalForAll(kofi, false);
        assertFalse(tix.isApprovedForAll(ama, kofi));
    }

    function test_10_SafeToGoodContract() public {
        GoodReceiver good = new GoodReceiver();
        uint256 id1 = _buy(ama);
        uint256 id2 = _buy(ama);
        vm.startPrank(ama);
        tix.safeTransferFrom(ama, address(good), id1);
        tix.safeTransferFrom(ama, address(good), id2, "hello");
        vm.stopPrank();
        assertEq(tix.ownerOf(id1), address(good));
        assertEq(tix.ownerOf(id2), address(good));
        assertEq(tix.balanceOf(address(good)), 2);
    }

    function test_10_SafeToBadContract() public {
        BadReceiver bad = new BadReceiver();
        uint256 id = _buy(ama);
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721InvalidReceiver.selector, address(bad)));
        vm.prank(ama);
        tix.safeTransferFrom(ama, address(bad), id);
        assertEq(tix.ownerOf(id), ama); // the whole transfer was undone

        // a plain wallet needs no receiver hook
        vm.prank(ama);
        tix.safeTransferFrom(ama, kofi, id);
        assertEq(tix.ownerOf(id), kofi);
    }

    function test_11_TokenURI() public {
        for (uint256 i = 0; i < 42; i++) {
            _buy(ama);
        }
        assertEq(tix.tokenURI(42), "ipfs://tix/42.json");
        assertEq(tix.tokenURI(7), "ipfs://tix/7.json");
    }

    function test_11b_UriNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721NonexistentToken.selector, 0));
        tix.tokenURI(0);
        vm.expectRevert(abi.encodeWithSelector(ConcertTickets.ERC721NonexistentToken.selector, 5));
        tix.tokenURI(5);
    }

    function test_12_Withdraw() public {
        _buy(ama);
        _buy(kofi);
        vm.expectRevert(ConcertTickets.NotOrganizer.selector);
        vm.prank(ama);
        tix.withdraw();

        uint256 before = organizer.balance;
        vm.prank(organizer);
        tix.withdraw();
        assertEq(organizer.balance, before + 2 * PRICE);
        assertEq(address(tix).balance, 0);
    }
}
