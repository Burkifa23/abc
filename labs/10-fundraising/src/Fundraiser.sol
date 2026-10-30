// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 10: Fundraising
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. Do not rename anything here: the tests depend on these names.
contract Fundraiser {
    enum Status {
        Open,
        Succeeded,
        Failed
    }

    error NotCreator();
    error NotOpen();
    error ZeroDonation();
    error TooEarly();
    error NotSucceeded();
    error NotFailed();
    error NothingToRefund();
    error TransferFailed();

    event Donated(address indexed donor, uint256 amount, uint256 raised);
    event GoalReached(uint256 raised);
    event Claimed(uint256 amount);
    event Refunded(address indexed donor, uint256 amount);
    event DescriptionUpdated(string description);

    address public immutable creator;
    uint256 public immutable goal;
    uint256 public immutable deadline;
    string public description;
    Status public status;
    uint256 public raised;
    mapping(address => uint256) public contributions;

    modifier onlyCreator() {
        // TODO: revert NotCreator() unless msg.sender == creator.
        _;
    }

    constructor(uint256 goal_, uint256 duration, string memory description_) {
        // already written
        creator = msg.sender;
        goal = goal_;
        deadline = block.timestamp + duration;
        description = description_;
    }

    function updateDescription(string calldata d) external onlyCreator {
        // TODO: store the new description and emit DescriptionUpdated.
    }

    function donate() external payable {
        // TODO: only while status is Open and block.timestamp < deadline (else NotOpen). Zero value reverts ZeroDonation.
        // Record the contribution, add to `raised`, emit Donated(donor, amount, raised).
        // When raised >= goal, set status to Succeeded right away and emit GoalReached. An overshoot is accepted in full.
    }

    function finalize() external {
        // TODO: anyone may call. Revert NotOpen if the status is not Open, TooEarly before the deadline.
        // Otherwise set the status to Failed.
    }

    function claim() external onlyCreator {
        // TODO: revert NotSucceeded unless the status is Succeeded.
        // Send the contract's whole balance to the creator with call{value: ...}, revert TransferFailed on failure, emit Claimed.
    }

    function refund() external {
        // TODO: revert NotFailed unless the status is Failed. Revert NothingToRefund if the sender gave nothing.
        // Zero the contribution BEFORE sending it back, then emit Refunded.
    }

    function cancel() external onlyCreator {
        // TODO: while Open, set the status to Failed so donors can be refunded. Otherwise revert NotOpen.
    }
}
