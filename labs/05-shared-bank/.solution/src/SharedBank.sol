// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 05: Shared Bank
contract SharedBank {
    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);
    error TransferFailed();

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    mapping(address => uint256) public balanceOf;
    uint256 public totalDeposits;

    function deposit() public payable {
        if (msg.value == 0) revert ZeroAmount();
        balanceOf[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    receive() external payable {
        deposit();
    }

    function transfer(address to, uint256 amount) external {
        uint256 available = balanceOf[msg.sender];
        if (amount > available) revert InsufficientBalance(amount, available);
        balanceOf[msg.sender] = available - amount;
        balanceOf[to] += amount; // after the subtraction, so a self-transfer leaves the balance unchanged
        emit Transferred(msg.sender, to, amount);
    }

    // WARNING: order matters, see test_08
    function withdraw(uint256 amount) external {
        // 1. Checks
        if (amount == 0) revert ZeroAmount();
        uint256 available = balanceOf[msg.sender];
        if (amount > available) revert InsufficientBalance(amount, available);
        // 2. Effects
        balanceOf[msg.sender] = available - amount;
        totalDeposits -= amount;
        // 3. Interactions
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }
}
