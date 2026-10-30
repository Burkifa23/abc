// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Sealed-bid public procurement (lab 16).
/// Constructor: `constructor(string memory description, uint256 biddingTime, uint256 revealTime) payable`.
/// The deployer is the agency and `msg.value` is the budget.
interface ITender {
    enum Phase {
        Bidding,
        Reveal,
        Awarded,
        Delivered,
        NoWinner
    }

    error NotAgency();
    error ZeroBudget();
    error WrongBond();
    error AlreadyBid();
    error TooEarly();
    error TooLate();
    error NoBid();
    error BadReveal();
    error AlreadyRevealed();
    error WrongPhase();
    error NothingToWithdraw();
    error TransferFailed();

    event BidSubmitted(address indexed supplier);
    event BidRevealed(address indexed supplier, uint256 price);
    event Awarded(address indexed winner, uint256 price);
    event NoWinnerDeclared();
    event DeliveryConfirmed(address indexed winner, uint256 price);

    function BOND() external view returns (uint256);
    function agency() external view returns (address);
    function budget() external view returns (uint256);
    function biddingEnd() external view returns (uint256);
    function revealEnd() external view returns (uint256);
    function description() external view returns (string memory);
    function winner() external view returns (address);
    function winningPrice() external view returns (uint256);
    function sealedBids(address supplier) external view returns (bytes32);
    function revealed(address supplier) external view returns (bool);
    function pendingWithdrawals(address who) external view returns (uint256);
    function phase() external view returns (Phase);
    function sealBid(uint256 price, bytes32 salt) external view returns (bytes32);
    function bid(bytes32 sealedBid) external payable;
    function reveal(uint256 price, bytes32 salt) external;
    function finalize() external;
    function confirmDelivery() external;
    function withdraw() external;
}
