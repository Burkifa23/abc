// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 12: Tic-Tac-Toe
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
        uint8 turn; // counts from 1
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
        if (opponent == msg.sender) revert SamePlayer();
        id = gameCount++;
        Game storage g = games[id];
        g.players[0] = msg.sender;
        g.players[1] = opponent;
        g.turn = 1;
        emit GameStarted(id, msg.sender, opponent);
    }

    function play(uint256 id, Tile calldata tile) external {
        if (id >= gameCount) revert GameNotFound();
        Game storage g = games[id];

        if (tile.row > 2 || tile.col > 2) revert TileOutOfBounds();
        if (g.state != State.Active) revert GameAlreadyOver();
        if (g.players[(g.turn - 1) % 2] != msg.sender) revert NotPlayersTurn();
        if (g.board[tile.row][tile.col] != Sign.Empty) revert TileAlreadySet();

        Sign sign = (g.turn % 2 == 1) ? Sign.X : Sign.O;
        g.board[tile.row][tile.col] = sign;
        emit Moved(id, msg.sender, tile.row, tile.col);

        // Check for a win BEFORE a tie: the ninth move can win.
        if (_isWinner(g.board, sign)) {
            g.state = State.Won;
            g.winner = msg.sender;
            emit GameOver(id, State.Won, msg.sender);
        } else if (g.turn == 9) {
            g.state = State.Tie;
            emit GameOver(id, State.Tie, address(0));
        } else {
            g.turn++;
        }
    }

    function board(uint256 id) external view returns (Sign[3][3] memory) {
        if (id >= gameCount) revert GameNotFound();
        return games[id].board;
    }

    function currentPlayer(uint256 id) external view returns (address) {
        if (id >= gameCount) revert GameNotFound();
        Game storage g = games[id];
        return g.players[(g.turn - 1) % 2];
    }

    function status(uint256 id) external view returns (State state, address winner) {
        if (id >= gameCount) revert GameNotFound();
        Game storage g = games[id];
        return (g.state, g.winner);
    }

    function _isWinner(Sign[3][3] storage b, Sign s) private view returns (bool) {
        for (uint256 i = 0; i < 3; i++) {
            if (b[i][0] == s && b[i][1] == s && b[i][2] == s) return true; // row
            if (b[0][i] == s && b[1][i] == s && b[2][i] == s) return true; // column
        }
        if (b[0][0] == s && b[1][1] == s && b[2][2] == s) return true; // diagonal
        if (b[0][2] == s && b[1][1] == s && b[2][0] == s) return true; // anti-diagonal
        return false;
    }
}
