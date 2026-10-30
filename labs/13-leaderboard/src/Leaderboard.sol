// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 13: Game Leaderboard
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. You choose how to store the board.
/// Do not rename anything here: the tests depend on these names.
contract Leaderboard {
    struct Player {
        string username;
        address addr;
        uint256 score;
    }

    error NotGameOwner();
    error WrongFee(uint256 sent, uint256 required);
    error BadUsername();
    error AlreadyPlaying();
    error NotPlaying();
    error NothingToWithdraw();
    error TransferFailed();

    event GameStarted(address indexed player, string username);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 rank); // rank 0 = not on board, else 1..5
    event FeesWithdrawn(uint256 amount);

    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_LEADERS = 5;

    address public immutable gameOwner;
    uint256 public feesOwed;
    mapping(address => bool) public hasPaid;
    mapping(address => string) public usernameOf;

    // TODO: add storage for the board. Hint: `Player[] internal board;`, kept sorted, highest score first.

    constructor() {
        gameOwner = msg.sender; // already written
    }

    function newGame(string calldata username) external payable {
        // TODO 1: revert WrongFee(msg.value, ENTRY_FEE) unless exactly ENTRY_FEE was sent.
        //         Revert BadUsername() if the username is empty or longer than 32 bytes.
        //         Revert AlreadyPlaying() if the sender already paid for a game.
        //         Then mark them as paid, save the username, add the fee to feesOwed and emit GameStarted.
    }

    function submitScore(address player, uint256 score) external {
        // TODO 2: only gameOwner (NotGameOwner). Revert NotPlaying() if the player has not paid.
        //         Mark the player as not paid (one score per paid game).
        // TODO 3: insert into the board with the private `_insert` below, then emit ScoreSubmitted(player, score, rank).
    }

    function leaderboard() external view returns (Player[] memory) {
        // TODO 4: return the board: at most MAX_LEADERS rows, highest score first.
    }

    function withdrawFees() external {
        // TODO 5: only gameOwner (NotGameOwner). Revert NothingToWithdraw() if feesOwed is 0.
        //         Zero feesOwed BEFORE sending, send with call{value: ...}, revert TransferFailed() on failure, emit FeesWithdrawn.
    }

    /// Returns the player's 1-based rank after the insert, or 0 if they did not make the board.
    function _insert(address player, uint256 score) private returns (uint256) {
        // TODO 6: keep the board sorted and at most MAX_LEADERS long.
        //   - If the player is already on the board, only a strictly better score changes anything (update, then re-sort).
        //   - If there is room, add the player. If the board is full, replace the last row only when the score is strictly higher.
        //   - Otherwise return 0.
        //   - On a tie, the earlier entry stays ahead (move up only when strictly greater).
    }
}
