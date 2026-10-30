// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 12: Tic-Tac-Toe
/// Fill in every TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
contract TicTacToe {
    enum Sign {
        Empty,
        X,
        O
    }

    enum State {
        Active,
        Won,
        Tie
    }

    struct Tile {
        uint8 row;
        uint8 col;
    }

    struct Game {
        address[2] players; // players[0] is X and moves first
        uint8 turn; // counts from 1; the player to move is players[(turn - 1) % 2]
        Sign[3][3] board;
        State state;
        address winner;
    }

    error SamePlayer();
    error GameNotFound();
    error TileOutOfBounds();
    error TileAlreadySet();
    error GameAlreadyOver();
    error NotPlayersTurn();

    event GameStarted(uint256 indexed id, address indexed x, address indexed o);
    event Moved(uint256 indexed id, address indexed player, uint8 row, uint8 col);
    event GameOver(uint256 indexed id, State state, address winner);

    uint256 public gameCount;
    mapping(uint256 => Game) internal games;

    function newGame(address opponent) external returns (uint256 id) {
        // TODO 1: revert SamePlayer() if the opponent is msg.sender.
        // TODO 2: the new game's id is the old gameCount; increase gameCount.
        //         Use `Game storage g = games[id];` then set players[0] = msg.sender (X), players[1] = opponent (O),
        //         and turn = 1. Emit GameStarted(id, msg.sender, opponent) and return the id.
    }

    function play(uint256 id, Tile calldata tile) external {
        // TODO 8: revert GameNotFound() if id >= gameCount. Then get a pointer: Game storage g = games[id];
        // TODO 5: revert TileOutOfBounds() if row or col is above 2.
        // TODO 11: revert GameAlreadyOver() if the game state is not Active.
        // TODO 7: revert NotPlayersTurn() unless msg.sender == g.players[(g.turn - 1) % 2].
        // TODO 6: revert TileAlreadySet() if the board tile is not Sign.Empty.
        // TODO 4: place the sign: Sign.X on odd turns, Sign.O on even turns. Emit Moved(id, msg.sender, row, col).
        // TODO 9: if _isWinner(...) set state Won, winner = msg.sender, emit GameOver.
        // TODO 12: else if turn == 9 set state Tie and emit GameOver(id, Tie, address(0)).
        //          Check the win FIRST: the ninth move can win.
        // TODO 13: otherwise increase g.turn.
    }

    function board(uint256 id) external view returns (Sign[3][3] memory) {
        // TODO 3: revert GameNotFound() for an unknown id, else return that game's board.
    }

    function currentPlayer(uint256 id) external view returns (address) {
        // TODO 3b: the player to move in game `id`.
    }

    function status(uint256 id) external view returns (State state, address winner) {
        // TODO 3c: the game's state and winner.
    }

    function _isWinner(Sign[3][3] storage b, Sign s) private view returns (bool) {
        // TODO 10: true if sign `s` fills any row, any column, or either diagonal of `b`.
        //          Hint: loop i from 0 to 2 and check b[i][0..2] and b[0..2][i]; then the two diagonals.
    }
}
