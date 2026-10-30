// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WordGuess} from "../src/WordGuess.sol";

contract WordGuessTest is Test {
    WordGuess game;
    address kofi = makeAddr("kofi");
    address ama = makeAddr("ama");

    event HintAdded(uint256 indexed round, string hint);
    event Guessed(uint256 indexed round, address indexed guesser, string guess, bool correct);

    function setUp() public {
        game = new WordGuess();
    }

    function _startRound() internal {
        game.setSecret(game.hashWord("akwaaba"));
    }

    function test_01_DeployerIsOwner() public view {
        assertEq(game.owner(), address(this));
    }

    function test_02_OnlyOwnerModifier() public {
        vm.prank(kofi);
        vm.expectRevert(WordGuess.NotOwner.selector);
        game.setSecret(bytes32(uint256(1)));
    }

    function test_03_HashWord() public view {
        assertEq(game.hashWord("akwaaba"), keccak256(bytes("akwaaba")));
    }

    function test_04_PrivateIsNotSecret() public {
        game.setNaiveSecret("akwaaba");
        // `private` only stops other contracts; anyone can read the raw storage slot.
        bytes32 slot0 = vm.load(address(game), bytes32(uint256(0)));
        // A short string (31 bytes or fewer) lives in the slot itself: the text is left-aligned
        // and the lowest byte holds length * 2.
        uint256 len = uint8(uint256(slot0)) / 2;
        bytes memory text = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            text[i] = slot0[i];
        }
        assertEq(string(text), "akwaaba");
    }

    function test_05_AddsHints() public {
        vm.expectEmit(true, false, false, true);
        emit HintAdded(0, "a greeting");
        game.addHint("a greeting");
        game.addHint("seven letters");

        string[] memory h = game.viewHints();
        assertEq(h.length, 2);
        assertEq(h[0], "a greeting");
        assertEq(h[1], "seven letters");
    }

    function test_05b_OnlyOwnerHints() public {
        vm.prank(kofi);
        vm.expectRevert(WordGuess.NotOwner.selector);
        game.addHint("nope");
    }

    function test_06_WrongGuess() public {
        _startRound();
        vm.expectEmit(true, true, false, true);
        emit Guessed(1, kofi, "hello", false);
        vm.prank(kofi);
        bool ok = game.makeGuess("hello");
        assertFalse(ok);
        assertEq(game.viewWinners().length, 0);
    }

    function test_06b_NoSecret() public {
        vm.prank(kofi);
        vm.expectRevert(WordGuess.NoSecret.selector);
        game.makeGuess("akwaaba");
    }

    function test_07_RightGuess() public {
        _startRound();
        vm.prank(kofi);
        bool ok = game.makeGuess("akwaaba");
        assertTrue(ok);
        address[] memory w = game.viewWinners();
        assertEq(w.length, 1);
        assertEq(w[0], kofi);
    }

    function test_08_CaseSensitive() public {
        _startRound();
        vm.prank(kofi);
        assertFalse(game.makeGuess("Akwaaba"));
    }

    function test_09_NewRoundResets() public {
        _startRound();
        game.addHint("a greeting");
        vm.prank(ama);
        game.makeGuess("akwaaba");
        assertEq(game.round(), 1);

        game.setSecret(game.hashWord("medaase"));
        assertEq(game.round(), 2);
        assertEq(game.viewHints().length, 0);
        assertEq(game.viewWinners().length, 0);
    }
}
