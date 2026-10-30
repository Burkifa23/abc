// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 16: Transparent Public Procurement
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations, the constructor and phase() are given. Do not rename anything here: the tests depend on these names.
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

    // Extra storage for you to use. Add more if you need it.
    address[] private _bidders; // everyone who bid, so finalize() can sort out the bonds
    bool private _finalized; // set by finalize()
    bool private _delivered; // set by confirmDelivery()

    constructor(string memory description_, uint256 biddingTime, uint256 revealTime) payable {
        // already written
        if (msg.value == 0) revert ZeroBudget();
        agency = msg.sender;
        budget = msg.value;
        description = description_;
        biddingEnd = block.timestamp + biddingTime;
        revealEnd = block.timestamp + biddingTime + revealTime;
    }

    /// already written
    function phase() public view returns (Phase) {
        if (_delivered) return Phase.Delivered;
        if (_finalized) return winner == address(0) ? Phase.NoWinner : Phase.Awarded;
        if (block.timestamp < biddingEnd) return Phase.Bidding;
        return Phase.Reveal; // from biddingEnd on, until finalize() is called
    }

    function sealBid(uint256 price, bytes32 salt) public view returns (bytes32) {
        // US2: return keccak256(abi.encodePacked(msg.sender, price, salt)).
        //      Binding the sender means nobody can copy another supplier's sealed bid.
    }

    function bid(bytes32 sealedBid) external payable {
        // US2: revert TooLate() if block.timestamp >= biddingEnd.
        //      Revert WrongBond() unless msg.value == BOND. Revert AlreadyBid() if the sender already has a sealed bid.
        //      Store the sealed bid, remember the bidder (push to _bidders) and emit BidSubmitted.
    }

    function reveal(uint256 price, bytes32 salt) external {
        // US3: the reveal window is biddingEnd <= now < revealEnd. Before it revert TooEarly(), from revealEnd on revert TooLate().
        //      Revert NoBid() if the sender never bid, AlreadyRevealed() if they already revealed,
        //      and BadReveal() if sealBid(price, salt) does not match their stored sealed bid.
        //      Mark them revealed and emit BidRevealed.
        // US4: if price <= budget and it is strictly lower than the best so far (or there is no winner yet),
        //      make the sender the winner. "Strictly" matters: on a tie the earlier reveal keeps the win.
    }

    function finalize() external {
        // US4: revert TooEarly() before revealEnd, and WrongPhase() if it already ran. Anyone may call it.
        //      Go through _bidders. A bidder who never revealed forfeits their BOND to the agency.
        //      A revealed bidder who is not the winner gets the BOND credited in pendingWithdrawals.
        //      With no winner: credit the agency budget + forfeited bonds and emit NoWinnerDeclared().
        //      With a winner: credit the agency the forfeited bonds only and emit Awarded(winner, winningPrice).
    }

    function confirmDelivery() external {
        // US5: only the agency (NotAgency). Revert WrongPhase() unless phase() is Awarded.
        //      Credit the winner winningPrice + BOND, credit the agency budget - winningPrice,
        //      and emit DeliveryConfirmed. Nobody is paid before this.
    }

    function withdraw() external {
        // US6: pull payment. Revert NothingToWithdraw() if the sender is owed 0.
        //      Zero their balance BEFORE sending with call{value: ...}, and revert TransferFailed() if the call fails.
    }
}
