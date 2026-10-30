// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 05: Shared Bank
/// Fill in every TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
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
        // TODO 1: revert ZeroAmount() if msg.value is 0.
        //         Otherwise add msg.value to the caller's balance and to totalDeposits, and emit Deposited.
    }

    receive() external payable {
        // TODO 2: plain ether (no function name) should count as a deposit. Call deposit().
    }

    function transfer(address to, uint256 amount) external {
        // TODO 3: move `amount` of the caller's balance to `to` inside the bank. No ether moves.
        //         Revert InsufficientBalance(amount, balance) if the caller has too little.
        //         Subtract first, then add, so sending to yourself changes nothing. Emit Transferred.
    }

    // WARNING: order matters, see test_08
    function withdraw(uint256 amount) external {
        // TODO 4: follow the three phases in this exact order.
        //   1. Checks:       revert ZeroAmount() if amount is 0; revert InsufficientBalance(amount, balance) if too much.
        //   2. Effects:      subtract from the caller's balance and from totalDeposits.
        //   3. Interactions: (bool ok,) = payable(msg.sender).call{value: amount}("");
        //                    revert TransferFailed() if !ok. Then emit Withdrawn.
    }
}
