// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CampusToken} from "../src/CampusToken.sol";

contract CampusTokenTest is Test {
    CampusToken token;
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function setUp() public {
        token = new CampusToken();
    }

    function test_01_Metadata() public view {
        assertEq(token.name(), "Ashesi Campus Token");
        assertEq(token.symbol(), "ACT");
        assertEq(token.decimals(), 18);
    }

    function test_02_MinterIsDeployer() public view {
        assertEq(token.minter(), address(this));
    }

    function test_03_Mint() public {
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), ama, 100e18);
        token.mint(ama, 100e18);
        assertEq(token.totalSupply(), 100e18);
        assertEq(token.balanceOf(ama), 100e18);
    }

    function test_03b_OnlyMinter() public {
        vm.prank(ama);
        vm.expectRevert(CampusToken.NotMinter.selector);
        token.mint(ama, 1);
    }

    function test_04_Burn() public {
        token.mint(ama, 100e18);

        vm.expectEmit(true, true, false, true);
        emit Transfer(ama, address(0), 40e18);
        vm.prank(ama);
        token.burn(40e18);
        assertEq(token.totalSupply(), 60e18);
        assertEq(token.balanceOf(ama), 60e18);

        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(CampusToken.ERC20InsufficientBalance.selector, ama, 60e18, 61e18));
        token.burn(61e18);
    }

    function test_05_Transfer() public {
        token.mint(ama, 100e18);
        vm.expectEmit(true, true, false, true);
        emit Transfer(ama, kofi, 30e18);
        vm.prank(ama);
        bool ok = token.transfer(kofi, 30e18);
        assertTrue(ok);
        assertEq(token.balanceOf(ama), 70e18);
        assertEq(token.balanceOf(kofi), 30e18);
    }

    function test_05b_ZeroTransfer() public {
        token.mint(ama, 1e18);
        vm.expectEmit(true, true, false, true);
        emit Transfer(ama, kofi, 0);
        vm.prank(ama);
        assertTrue(token.transfer(kofi, 0));
        assertEq(token.balanceOf(ama), 1e18);
    }

    function test_06_InsufficientBalance() public {
        token.mint(ama, 10e18);
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(CampusToken.ERC20InsufficientBalance.selector, ama, 10e18, 11e18));
        token.transfer(kofi, 11e18);
    }

    function test_06_NoTransferToZero() public {
        token.mint(ama, 10e18);
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(CampusToken.ERC20InvalidReceiver.selector, address(0)));
        token.transfer(address(0), 1e18);
    }

    function test_07_Approve() public {
        vm.expectEmit(true, true, false, true);
        emit Approval(ama, kofi, 50e18);
        vm.prank(ama);
        bool ok = token.approve(kofi, 50e18);
        assertTrue(ok);
        assertEq(token.allowance(ama, kofi), 50e18);

        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(CampusToken.ERC20InvalidSpender.selector, address(0)));
        token.approve(address(0), 1);
    }

    function test_07b_ApproveOverwrites() public {
        vm.startPrank(ama);
        token.approve(kofi, 50);
        token.approve(kofi, 20);
        vm.stopPrank();
        assertEq(token.allowance(ama, kofi), 20);
    }

    function test_08_TransferFrom() public {
        token.mint(ama, 100e18);
        vm.prank(ama);
        token.approve(kofi, 50e18);

        vm.expectEmit(true, true, false, true);
        emit Transfer(ama, esi, 30e18);
        vm.prank(kofi);
        bool ok = token.transferFrom(ama, esi, 30e18);
        assertTrue(ok);

        assertEq(token.allowance(ama, kofi), 20e18);
        assertEq(token.balanceOf(ama), 70e18);
        assertEq(token.balanceOf(esi), 30e18);
    }

    function test_08b_InsufficientAllowance() public {
        token.mint(ama, 100e18);
        vm.prank(ama);
        token.approve(kofi, 10e18);
        vm.prank(kofi);
        vm.expectRevert(abi.encodeWithSelector(CampusToken.ERC20InsufficientAllowance.selector, kofi, 10e18, 11e18));
        token.transferFrom(ama, esi, 11e18);
    }

    function test_09_InfiniteAllowance() public {
        token.mint(ama, 100e18);
        vm.prank(ama);
        token.approve(kofi, type(uint256).max);
        vm.prank(kofi);
        token.transferFrom(ama, esi, 30e18);
        assertEq(token.allowance(ama, kofi), type(uint256).max);
    }

    function testFuzz_10_SupplyInvariant(uint96 a, uint96 b) public {
        token.mint(ama, a);
        token.mint(kofi, b);
        vm.prank(ama);
        token.transfer(kofi, a / 2);
        assertEq(token.totalSupply(), token.balanceOf(ama) + token.balanceOf(kofi));
        assertEq(token.totalSupply(), uint256(a) + uint256(b));
    }
}
