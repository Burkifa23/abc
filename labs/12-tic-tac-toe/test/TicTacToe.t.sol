// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TicTacToe} from "../src/TicTacToe.sol";

contract TicTacToeTest is Test {
    TicTacToe ttt;
    address ama = makeAddr("ama"); // X, moves first
    address kofi = makeAddr("kofi"); // O
    address mallory = makeAddr("mallory");

    event GameStarted(uint256 indexed id, address indexed x, address indexed o);
    event Moved(uint256 indexed id, address indexed player, uint8 row, uint8 col);
    event GameOver(uint256 indexed id, TicTacToe.State state, address winner);

    function setUp() public {
        ttt = new TicTacToe();
    }

    function _start() internal returns (uint256 id) {
        vm.prank(ama);
        id = ttt.newGame(kofi);
    }

    function _move(uint256 id, address who, uint8 row, uint8 col) internal {
        vm.prank(who);
        ttt.play(id, TicTacToe.Tile(row, col));
    }

    function test_01_NoGamesYet() public view {
        assertEq(ttt.gameCount(), 0);
    }

    function test_02_NewGame() public {
        vm.expectEmit(true, true, true, false);
        emit GameStarted(0, ama, kofi);
        vm.prank(ama);
        uint256 id = ttt.newGame(kofi);
        assertEq(id, 0);
        assertEq(ttt.gameCount(), 1);
        assertEq(ttt.currentPlayer(0), ama);
    }

    function test_02b_SamePlayer() public {
        vm.prank(ama);
        vm.expectRevert(TicTacToe.SamePlayer.selector);
        ttt.newGame(ama);
    }

    function test_03_EmptyBoard() public {
        uint256 id = _start();
        TicTacToe.Sign[3][3] memory b = ttt.board(id);
        for (uint256 r = 0; r < 3; r++) {
            for (uint256 c = 0; c < 3; c++) {
                assertEq(uint256(b[r][c]), uint256(TicTacToe.Sign.Empty));
            }
        }
    }

    function test_04_FirstMove() public {
        uint256 id = _start();
        vm.expectEmit(true, true, false, true);
        emit Moved(id, ama, 1, 1);
        _move(id, ama, 1, 1);
        assertEq(uint256(ttt.board(id)[1][1]), uint256(TicTacToe.Sign.X));
        assertEq(ttt.currentPlayer(id), kofi);
    }

    function test_05_OutOfBounds() public {
        uint256 id = _start();
        vm.prank(ama);
        vm.expectRevert(TicTacToe.TileOutOfBounds.selector);
        ttt.play(id, TicTacToe.Tile(3, 0));
    }

    function test_06_TileTaken() public {
        uint256 id = _start();
        _move(id, ama, 0, 0);
        vm.prank(kofi);
        vm.expectRevert(TicTacToe.TileAlreadySet.selector);
        ttt.play(id, TicTacToe.Tile(0, 0));
    }

    function test_07_NotYourTurn() public {
        uint256 id = _start();
        vm.prank(kofi);
        vm.expectRevert(TicTacToe.NotPlayersTurn.selector);
        ttt.play(id, TicTacToe.Tile(0, 0));

        vm.prank(mallory);
        vm.expectRevert(TicTacToe.NotPlayersTurn.selector);
        ttt.play(id, TicTacToe.Tile(0, 0));
    }

    function test_08_Alternates() public {
        uint256 id = _start();
        _move(id, ama, 0, 0);
        _move(id, kofi, 1, 1);
        _move(id, ama, 2, 2);
        TicTacToe.Sign[3][3] memory b = ttt.board(id);
        assertEq(uint256(b[0][0]), uint256(TicTacToe.Sign.X));
        assertEq(uint256(b[1][1]), uint256(TicTacToe.Sign.O));
        assertEq(uint256(b[2][2]), uint256(TicTacToe.Sign.X));
    }

    function test_08b_UnknownGame() public {
        vm.prank(ama);
        vm.expectRevert(TicTacToe.GameNotFound.selector);
        ttt.play(5, TicTacToe.Tile(0, 0));
    }

    function test_09_RowWin() public {
        uint256 id = _start();
        // X: (0,0) (0,1) (0,2)   O: (1,0) (1,1)
        _move(id, ama, 0, 0);
        _move(id, kofi, 1, 0);
        _move(id, ama, 0, 1);
        _move(id, kofi, 1, 1);

        vm.expectEmit(true, false, false, true);
        emit GameOver(id, TicTacToe.State.Won, ama);
        _move(id, ama, 0, 2);

        (TicTacToe.State state, address winner) = ttt.status(id);
        assertEq(uint256(state), uint256(TicTacToe.State.Won));
        assertEq(winner, ama);
    }

    function test_10_DiagonalAndColumnWins() public {
        // Game 0: O wins on the anti-diagonal (0,2) (1,1) (2,0)
        uint256 a = _start();
        _move(a, ama, 0, 0);
        _move(a, kofi, 0, 2);
        _move(a, ama, 0, 1);
        _move(a, kofi, 1, 1);
        _move(a, ama, 1, 0);
        _move(a, kofi, 2, 0);
        (TicTacToe.State sa, address wa) = ttt.status(a);
        assertEq(uint256(sa), uint256(TicTacToe.State.Won));
        assertEq(wa, kofi);

        // Game 1: X wins down column 0
        uint256 b = _start();
        _move(b, ama, 0, 0);
        _move(b, kofi, 0, 1);
        _move(b, ama, 1, 0);
        _move(b, kofi, 1, 1);
        _move(b, ama, 2, 0);
        (TicTacToe.State sb, address wb) = ttt.status(b);
        assertEq(uint256(sb), uint256(TicTacToe.State.Won));
        assertEq(wb, ama);
    }

    function test_11_NoMovesAfterWin() public {
        uint256 id = _start();
        _move(id, ama, 0, 0);
        _move(id, kofi, 1, 0);
        _move(id, ama, 0, 1);
        _move(id, kofi, 1, 1);
        _move(id, ama, 0, 2); // X wins
        vm.prank(kofi);
        vm.expectRevert(TicTacToe.GameAlreadyOver.selector);
        ttt.play(id, TicTacToe.Tile(2, 2));
    }

    function test_12_WinOnLastMove() public {
        uint256 id = _start();
        // Final board:  X O X / O O X / O X X   (X completes column 2 with the ninth move)
        _move(id, ama, 0, 0);
        _move(id, kofi, 0, 1);
        _move(id, ama, 0, 2);
        _move(id, kofi, 1, 0);
        _move(id, ama, 2, 1);
        _move(id, kofi, 1, 1);
        _move(id, ama, 1, 2);
        _move(id, kofi, 2, 0);
        _move(id, ama, 2, 2);

        (TicTacToe.State state, address winner) = ttt.status(id);
        assertEq(uint256(state), uint256(TicTacToe.State.Won));
        assertEq(winner, ama);
    }

    function test_12b_Tie() public {
        uint256 id = _start();
        // Final board:  X O X / X O O / O X X   (no line for either player)
        _move(id, ama, 0, 0);
        _move(id, kofi, 0, 1);
        _move(id, ama, 0, 2);
        _move(id, kofi, 1, 1);
        _move(id, ama, 1, 0);
        _move(id, kofi, 1, 2);
        _move(id, ama, 2, 1);
        _move(id, kofi, 2, 0);

        vm.expectEmit(true, false, false, true);
        emit GameOver(id, TicTacToe.State.Tie, address(0));
        _move(id, ama, 2, 2);

        (TicTacToe.State state, address winner) = ttt.status(id);
        assertEq(uint256(state), uint256(TicTacToe.State.Tie));
        assertEq(winner, address(0));
    }

    function test_13_IndependentGames() public {
        uint256 g0 = _start();
        vm.prank(kofi);
        uint256 g1 = ttt.newGame(mallory); // kofi is X here
        assertEq(g1, 1);

        _move(g0, ama, 0, 0);
        TicTacToe.Sign[3][3] memory b1 = ttt.board(g1);
        assertEq(uint256(b1[0][0]), uint256(TicTacToe.Sign.Empty));
        assertEq(ttt.currentPlayer(g1), kofi);
        assertEq(ttt.currentPlayer(g0), kofi);

        vm.prank(kofi);
        ttt.play(g1, TicTacToe.Tile(2, 2));
        assertEq(uint256(ttt.board(g0)[2][2]), uint256(TicTacToe.Sign.Empty));
    }
}
