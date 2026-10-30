// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 13: Game Leaderboard
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

    Player[] internal board; // sorted by score, highest first

    constructor() {
        gameOwner = msg.sender;
    }

    function newGame(string calldata username) external payable {
        if (msg.value != ENTRY_FEE) revert WrongFee(msg.value, ENTRY_FEE);
        uint256 len = bytes(username).length;
        if (len == 0 || len > 32) revert BadUsername();
        if (hasPaid[msg.sender]) revert AlreadyPlaying();

        hasPaid[msg.sender] = true;
        usernameOf[msg.sender] = username;
        feesOwed += msg.value;
        emit GameStarted(msg.sender, username);
    }

    function submitScore(address player, uint256 score) external {
        if (msg.sender != gameOwner) revert NotGameOwner();
        if (!hasPaid[player]) revert NotPlaying();
        hasPaid[player] = false; // each paid game ends with one score
        emit ScoreSubmitted(player, score, _insert(player, score));
    }

    function leaderboard() external view returns (Player[] memory) {
        return board;
    }

    function withdrawFees() external {
        if (msg.sender != gameOwner) revert NotGameOwner();
        uint256 amount = feesOwed;
        if (amount == 0) revert NothingToWithdraw();
        feesOwed = 0;
        (bool ok,) = payable(gameOwner).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit FeesWithdrawn(amount);
    }

    /// Returns the player's 1-based rank after the insert, or 0 if not on the board.
    function _insert(address player, uint256 score) private returns (uint256) {
        uint256 len = board.length;
        uint256 i = len; // len means "not found"
        for (uint256 j = 0; j < len; j++) {
            if (board[j].addr == player) {
                i = j;
                break;
            }
        }

        if (i < len) {
            // already on the board: keep only the best score
            if (score <= board[i].score) return i + 1;
            board[i].score = score;
            board[i].username = usernameOf[player];
        } else if (len < MAX_LEADERS) {
            board.push(Player(usernameOf[player], player, score));
        } else if (score > board[len - 1].score) {
            i = len - 1; // replace the last place
            board[i] = Player(usernameOf[player], player, score);
        } else {
            return 0;
        }

        if (i == len) i = board.length - 1; // newly pushed
        // bubble up; strict > keeps the earlier entry ahead on a tie
        while (i > 0 && board[i].score > board[i - 1].score) {
            Player memory tmp = board[i - 1];
            board[i - 1] = board[i];
            board[i] = tmp;
            i--;
        }
        return i + 1;
    }
}
