// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {GameMarketplace} from "../src/GameMarketplace.sol";

contract GameMarketplaceTest is Test {
    GameMarketplace shop;
    address ama = makeAddr("ama");

    event Joined(address indexed player);
    event Bought(address indexed player, string item, uint256 price);
    event Sold(address indexed player, string item, uint256 refund);

    function _names() internal pure returns (string[] memory n) {
        n = new string[](4);
        n[0] = "sword";
        n[1] = "shield";
        n[2] = "potion";
        n[3] = "crown";
    }

    function _prices() internal pure returns (uint256[] memory p) {
        p = new uint256[](4);
        p[0] = 10;
        p[1] = 15;
        p[2] = 5;
        p[3] = 41;
    }

    function setUp() public {
        shop = new GameMarketplace(_names(), _prices());
    }

    function _join() internal {
        vm.prank(ama);
        shop.join();
    }

    // US1: the game is created with a list of items and prices
    function test_US1_ListsItems() public view {
        assertEq(shop.itemCount(), 4);
        (string memory name, uint256 price) = shop.itemAt(1);
        assertEq(name, "shield");
        assertEq(price, 15);
    }

    function test_US1_LengthMismatch() public {
        string[] memory n = new string[](2);
        n[0] = "sword";
        n[1] = "shield";
        uint256[] memory p = new uint256[](1);
        p[0] = 10;
        vm.expectRevert(GameMarketplace.LengthMismatch.selector);
        new GameMarketplace(n, p);
    }

    function test_US1_ZeroPrice() public {
        string[] memory n = new string[](2);
        n[0] = "sword";
        n[1] = "bow";
        uint256[] memory p = new uint256[](2);
        p[0] = 10;
        p[1] = 0;
        vm.expectRevert(abi.encodeWithSelector(GameMarketplace.ZeroPrice.selector, "bow"));
        new GameMarketplace(n, p);
    }

    // US2: a player joins once and gets 40 coins
    function test_US2_JoinGives40() public {
        vm.expectEmit(true, false, false, false);
        emit Joined(ama);
        _join();
        assertEq(shop.coins(ama), 40);
        assertTrue(shop.joined(ama));
    }

    function test_US2_JoinOnce() public {
        _join();
        vm.prank(ama);
        vm.expectRevert(GameMarketplace.AlreadyJoined.selector);
        shop.join();
    }

    // US3: unknown items have price 0
    function test_US3_UnknownPriceZero() public view {
        assertEq(shop.priceOf("bow"), 0);
        assertEq(shop.priceOf("sword"), 10);
    }

    // US4: buying needs a joined player and a known item
    function test_US4_BuyRequiresJoin() public {
        vm.prank(ama);
        vm.expectRevert(GameMarketplace.NotJoined.selector);
        shop.buy("sword");
    }

    function test_US4_UnknownItem() public {
        _join();
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(GameMarketplace.UnknownItem.selector, "bow"));
        shop.buy("bow");
    }

    // US5: buying costs coins and adds to the inventory
    function test_US5_BuyDeducts() public {
        _join();
        vm.expectEmit(true, false, false, true);
        emit Bought(ama, "sword", 10);
        vm.prank(ama);
        shop.buy("sword");
        assertEq(shop.coins(ama), 30);
        assertEq(shop.inventory(ama, "sword"), 1);
    }

    function test_US5_InsufficientCoins() public {
        _join();
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(GameMarketplace.InsufficientCoins.selector, 41, 40));
        shop.buy("crown");
    }

    function test_US5_ExactBalance() public {
        _join();
        vm.startPrank(ama);
        shop.buy("sword"); // 10
        shop.buy("sword"); // 10
        shop.buy("shield"); // 15 -> 5 left
        shop.buy("potion"); // 5 -> 0 left
        vm.stopPrank();
        assertEq(shop.coins(ama), 0);
        assertEq(shop.inventory(ama, "sword"), 2);
        assertEq(shop.inventory(ama, "potion"), 1);
    }

    // US6: selling returns half the price
    function test_US6_SellRefundsHalf() public {
        _join();
        vm.startPrank(ama);
        shop.buy("potion"); // 40 -> 35
        vm.expectEmit(true, false, false, true);
        emit Sold(ama, "potion", 2);
        shop.sell("potion"); // 5 / 2 = 2
        vm.stopPrank();
        assertEq(shop.coins(ama), 37);
        assertEq(shop.inventory(ama, "potion"), 0);
    }

    function test_US6_CannotSellUnowned() public {
        _join();
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(GameMarketplace.NotOwned.selector, "sword"));
        shop.sell("sword");
    }
}
