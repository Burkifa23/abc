// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 10: Fundraising
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
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    constructor(uint256 goal_, uint256 duration, string memory description_) {
        creator = msg.sender;
        goal = goal_;
        deadline = block.timestamp + duration;
        description = description_;
    }

    function updateDescription(string calldata d) external onlyCreator {
        description = d;
        emit DescriptionUpdated(d);
    }

    function donate() external payable {
        if (status != Status.Open || block.timestamp >= deadline) revert NotOpen();
        if (msg.value == 0) revert ZeroDonation();

        contributions[msg.sender] += msg.value;
        raised += msg.value;
        emit Donated(msg.sender, msg.value, raised);

        if (raised >= goal) {
            status = Status.Succeeded;
            emit GoalReached(raised);
        }
    }

    function finalize() external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp < deadline) revert TooEarly();
        status = Status.Failed;
    }

    function claim() external onlyCreator {
        if (status != Status.Succeeded) revert NotSucceeded();
        uint256 amount = address(this).balance;
        emit Claimed(amount);
        (bool ok,) = payable(creator).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function refund() external {
        if (status != Status.Failed) revert NotFailed();
        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NothingToRefund();
        contributions[msg.sender] = 0; // effects before the call
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Refunded(msg.sender, amount);
    }

    function cancel() external onlyCreator {
        if (status != Status.Open) revert NotOpen();
        status = Status.Failed;
    }
}
