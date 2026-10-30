// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITender} from "./interfaces/ITender.sol";

/// @title Tender
/// @notice A sealed-bid public tender with the budget held in escrow and payment on confirmed delivery.
contract Tender is ITender {
    uint256 public constant BOND = 0.1 ether;

    address public immutable agency;
    uint256 public immutable budget;
    uint256 public immutable biddingEnd;
    uint256 public immutable revealEnd;
    string public description;

    address public winner; // the best valid revealed bidder so far; final once finalize() has run
    uint256 public winningPrice;
    mapping(address => bytes32) public sealedBids;
    mapping(address => bool) public revealed;
    mapping(address => uint256) public pendingWithdrawals;

    address[] private _bidders;
    bool private _finalized;
    bool private _delivered;

    /// @param description_ What is being bought.
    /// @param biddingTime Seconds the bidding window stays open.
    /// @param revealTime Seconds the reveal window stays open after bidding.
    constructor(string memory description_, uint256 biddingTime, uint256 revealTime) payable {
        if (msg.value == 0) revert ZeroBudget();
        agency = msg.sender;
        budget = msg.value;
        description = description_;
        biddingEnd = block.timestamp + biddingTime;
        revealEnd = block.timestamp + biddingTime + revealTime;
    }

    /// @notice The current phase, from the clock and the stored outcome.
    function phase() public view returns (Phase) {
        if (_delivered) return Phase.Delivered;
        if (_finalized) return winner == address(0) ? Phase.NoWinner : Phase.Awarded;
        if (block.timestamp < biddingEnd) return Phase.Bidding;
        return Phase.Reveal;
    }

    /// @notice The sealed form of a bid, bound to the caller.
    function sealBid(uint256 price, bytes32 salt) public view returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, price, salt));
    }

    /// @notice Submits a sealed bid with the fixed bond.
    function bid(bytes32 sealedBid) external payable {
        if (block.timestamp >= biddingEnd) revert TooLate();
        if (msg.value != BOND) revert WrongBond();
        if (sealedBids[msg.sender] != bytes32(0)) revert AlreadyBid();
        sealedBids[msg.sender] = sealedBid;
        _bidders.push(msg.sender);
        emit BidSubmitted(msg.sender);
    }

    /// @notice Opens a sealed bid during the reveal window.
    function reveal(uint256 price, bytes32 salt) external {
        if (block.timestamp < biddingEnd) revert TooEarly();
        if (block.timestamp >= revealEnd) revert TooLate();
        if (sealedBids[msg.sender] == bytes32(0)) revert NoBid();
        if (revealed[msg.sender]) revert AlreadyRevealed();
        if (sealBid(price, salt) != sealedBids[msg.sender]) revert BadReveal();
        revealed[msg.sender] = true;
        // Over-budget bids may be revealed but never win. A tie keeps the earlier reveal.
        if (price <= budget && (winner == address(0) || price < winningPrice)) {
            winner = msg.sender;
            winningPrice = price;
        }
        emit BidRevealed(msg.sender, price);
    }

    /// @notice Closes the tender after the reveal window and settles the bonds.
    function finalize() external {
        if (block.timestamp < revealEnd) revert TooEarly();
        if (_finalized) revert WrongPhase();
        _finalized = true;
        uint256 forfeited;
        for (uint256 i = 0; i < _bidders.length; i++) {
            address b = _bidders[i];
            if (!revealed[b]) forfeited += BOND;
            else if (b != winner) pendingWithdrawals[b] += BOND;
        }
        if (winner == address(0)) {
            pendingWithdrawals[agency] += budget + forfeited;
            emit NoWinnerDeclared();
        } else {
            pendingWithdrawals[agency] += forfeited;
            emit Awarded(winner, winningPrice);
        }
    }

    /// @notice The agency confirms delivery, which releases the payment.
    function confirmDelivery() external {
        if (msg.sender != agency) revert NotAgency();
        if (phase() != Phase.Awarded) revert WrongPhase();
        _delivered = true;
        pendingWithdrawals[winner] += winningPrice + BOND;
        pendingWithdrawals[agency] += budget - winningPrice;
        emit DeliveryConfirmed(winner, winningPrice);
    }

    /// @notice Pays out what the caller is owed.
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        pendingWithdrawals[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
