// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Facilitator reference. Learners: try first, peek later.
contract Tender {
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

    address[] private _bidders; // everyone who bid, so finalize() can sort out the bonds
    bool private _finalized;
    bool private _delivered;

    constructor(string memory description_, uint256 biddingTime, uint256 revealTime) payable {
        if (msg.value == 0) revert ZeroBudget();
        agency = msg.sender;
        budget = msg.value;
        description = description_;
        biddingEnd = block.timestamp + biddingTime;
        revealEnd = block.timestamp + biddingTime + revealTime;
    }

    function phase() public view returns (Phase) {
        if (_delivered) return Phase.Delivered;
        if (_finalized) return winner == address(0) ? Phase.NoWinner : Phase.Awarded;
        if (block.timestamp < biddingEnd) return Phase.Bidding;
        return Phase.Reveal; // from biddingEnd on, until finalize() is called
    }

    function sealBid(uint256 price, bytes32 salt) public view returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, price, salt));
    }

    function bid(bytes32 sealedBid) external payable {
        if (block.timestamp >= biddingEnd) revert TooLate();
        if (msg.value != BOND) revert WrongBond();
        if (sealedBids[msg.sender] != bytes32(0)) revert AlreadyBid();
        sealedBids[msg.sender] = sealedBid;
        _bidders.push(msg.sender);
        emit BidSubmitted(msg.sender);
    }

    function reveal(uint256 price, bytes32 salt) external {
        if (block.timestamp < biddingEnd) revert TooEarly();
        if (block.timestamp >= revealEnd) revert TooLate();
        if (sealedBids[msg.sender] == bytes32(0)) revert NoBid();
        if (revealed[msg.sender]) revert AlreadyRevealed();
        if (sealBid(price, salt) != sealedBids[msg.sender]) revert BadReveal();
        revealed[msg.sender] = true;
        // Over-budget bids are valid to reveal but can never win. A tie keeps the earlier reveal (strict <).
        if (price <= budget && (winner == address(0) || price < winningPrice)) {
            winner = msg.sender;
            winningPrice = price;
        }
        emit BidRevealed(msg.sender, price);
    }

    function finalize() external {
        if (block.timestamp < revealEnd) revert TooEarly();
        if (_finalized) revert WrongPhase();
        _finalized = true;
        uint256 forfeited;
        for (uint256 i = 0; i < _bidders.length; i++) {
            address b = _bidders[i];
            if (!revealed[b]) forfeited += BOND; // never revealed (or only ever revealed wrongly): penalty to the agency
            else if (b != winner) pendingWithdrawals[b] += BOND; // revealed losers get the bond back
        }
        if (winner == address(0)) {
            pendingWithdrawals[agency] += budget + forfeited;
            emit NoWinnerDeclared();
        } else {
            pendingWithdrawals[agency] += forfeited; // budget - price follows on delivery
            emit Awarded(winner, winningPrice);
        }
    }

    function confirmDelivery() external {
        if (msg.sender != agency) revert NotAgency();
        if (phase() != Phase.Awarded) revert WrongPhase();
        _delivered = true;
        pendingWithdrawals[winner] += winningPrice + BOND;
        pendingWithdrawals[agency] += budget - winningPrice;
        emit DeliveryConfirmed(winner, winningPrice);
    }

    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        pendingWithdrawals[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
