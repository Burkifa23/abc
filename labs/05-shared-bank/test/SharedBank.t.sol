// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SharedBank} from "../src/SharedBank.sol";

contract Attacker {
    SharedBank public bank;

    constructor(SharedBank _bank) {
        bank = _bank;
    }

    receive() external payable {
        if (address(bank).balance >= 1 ether) {
            bank.withdraw(1 ether);
        }
    }

    function attack() external payable {
        bank.deposit{value: msg.value}();
        bank.withdraw(msg.value);
    }
}

contract SharedBankTest is Test {
    SharedBank bank;
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    function setUp() public {
        bank = new SharedBank();
        vm.deal(ama, 10 ether);
        vm.deal(kofi, 10 ether);
    }

    function _assertSolvent() internal view {
        assertEq(address(bank).balance, bank.totalDeposits());
    }

    function test_01_StartsEmpty() public view {
        assertEq(bank.totalDeposits(), 0);
        assertEq(bank.balanceOf(ama), 0);
    }

    function test_02_Deposit() public {
        vm.expectEmit(true, false, false, true);
        emit Deposited(ama, 1 ether);
        vm.prank(ama);
        bank.deposit{value: 1 ether}();

        assertEq(bank.balanceOf(ama), 1 ether);
        assertEq(bank.totalDeposits(), 1 ether);
        _assertSolvent();
    }

    function test_02b_ZeroDeposit() public {
        vm.prank(ama);
        vm.expectRevert(SharedBank.ZeroAmount.selector);
        bank.deposit{value: 0}();
    }

    function test_03_ReceiveCredits() public {
        vm.prank(ama);
        (bool ok,) = payable(address(bank)).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(bank.balanceOf(ama), 1 ether);
        assertEq(bank.totalDeposits(), 1 ether);
        _assertSolvent();
    }

    function test_04_Withdraw() public {
        vm.prank(ama);
        bank.deposit{value: 1 ether}();
        uint256 before = ama.balance;

        vm.expectEmit(true, false, false, true);
        emit Withdrawn(ama, 0.4 ether);
        vm.prank(ama);
        bank.withdraw(0.4 ether);

        assertEq(ama.balance, before + 0.4 ether);
        assertEq(bank.balanceOf(ama), 0.6 ether);
        _assertSolvent();
    }

    function test_05_WithdrawTooMuch() public {
        vm.prank(ama);
        bank.deposit{value: 1 ether}();
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(SharedBank.InsufficientBalance.selector, 2 ether, 1 ether));
        bank.withdraw(2 ether);
    }

    function test_05b_ZeroWithdraw() public {
        vm.prank(ama);
        bank.deposit{value: 1 ether}();
        vm.prank(ama);
        vm.expectRevert(SharedBank.ZeroAmount.selector);
        bank.withdraw(0);
    }

    function test_06_InternalTransfer() public {
        vm.prank(ama);
        bank.deposit{value: 1 ether}();
        uint256 bankEther = address(bank).balance;

        vm.expectEmit(true, true, false, true);
        emit Transferred(ama, kofi, 0.3 ether);
        vm.prank(ama);
        bank.transfer(kofi, 0.3 ether);

        assertEq(bank.balanceOf(ama), 0.7 ether);
        assertEq(bank.balanceOf(kofi), 0.3 ether);
        assertEq(address(bank).balance, bankEther);
        _assertSolvent();
    }

    function test_06b_SelfTransfer() public {
        vm.prank(ama);
        bank.deposit{value: 1 ether}();
        vm.prank(ama);
        bank.transfer(ama, 0.3 ether);
        assertEq(bank.balanceOf(ama), 1 ether);
        _assertSolvent();
    }

    function test_07_TransferTooMuch() public {
        vm.prank(ama);
        bank.deposit{value: 1 ether}();
        vm.prank(ama);
        vm.expectRevert(abi.encodeWithSelector(SharedBank.InsufficientBalance.selector, 2 ether, 1 ether));
        bank.transfer(kofi, 2 ether);
    }

    function test_08_ReentrancyFails() public {
        vm.prank(kofi);
        bank.deposit{value: 10 ether}();
        _assertSolvent();

        Attacker attacker = new Attacker(bank);
        vm.deal(address(attacker), 1 ether);
        vm.expectRevert(SharedBank.TransferFailed.selector);
        attacker.attack{value: 1 ether}();

        assertEq(address(bank).balance, 10 ether);
        assertEq(bank.balanceOf(kofi), 10 ether);
        _assertSolvent();
    }
}
