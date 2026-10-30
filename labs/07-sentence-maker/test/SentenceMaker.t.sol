// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SentenceMaker} from "../src/SentenceMaker.sol";

contract SentenceMakerTest is Test {
    SentenceMaker s;
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");

    event WordAdded(address indexed by, string word);

    function setUp() public {
        s = new SentenceMaker("Akwaaba");
    }

    // US1: the contract starts with a first word
    function test_US1_InitWord() public view {
        assertEq(s.viewSentence(), "Akwaaba");
    }

    function test_US1_InitRejectsSpace() public {
        vm.expectRevert(SentenceMaker.NoSpacesAllowed.selector);
        new SentenceMaker("Akwaaba friend");
    }

    // US2: anyone adds a word, joined with a space
    function test_US2_AddWord() public {
        vm.expectEmit(true, false, false, true);
        emit WordAdded(ama, "to");
        vm.prank(ama);
        s.addWord("to");
        assertEq(s.viewSentence(), "Akwaaba to");
    }

    // US3: words have no spaces and are not empty
    function test_US3_NoSpaces() public {
        vm.prank(ama);
        vm.expectRevert(SentenceMaker.NoSpacesAllowed.selector);
        s.addWord("to Ashesi");
    }

    function test_US3_NoEmpty() public {
        vm.prank(ama);
        vm.expectRevert(SentenceMaker.EmptyWord.selector);
        s.addWord("");
    }

    function test_US3_Utf8Word() public {
        vm.prank(ama);
        s.addWord(unicode"Ɛyɛ");
        assertEq(s.viewSentence(), unicode"Akwaaba Ɛyɛ");
    }

    // US4: a sentence ending in . ? ! is complete
    function test_US4_Complete() public {
        assertFalse(s.isComplete());
        vm.prank(ama);
        s.addWord("Ashesi!");
        assertTrue(s.isComplete());
    }

    // US5: a complete sentence takes no more words
    function test_US5_RejectsAfterComplete() public {
        vm.prank(ama);
        s.addWord("Ashesi!");
        vm.prank(kofi);
        vm.expectRevert(SentenceMaker.SentenceComplete.selector);
        s.addWord("again");
    }

    function test_US5_CompleteFromStart() public {
        SentenceMaker hi = new SentenceMaker("Hi!");
        assertTrue(hi.isComplete());
        vm.prank(ama);
        vm.expectRevert(SentenceMaker.SentenceComplete.selector);
        hi.addWord("there");
    }

    // US6: no account adds two words in a row
    function test_US6_TwoInARow() public {
        vm.startPrank(ama);
        s.addWord("to");
        vm.expectRevert(SentenceMaker.TwoWordsInARow.selector);
        s.addWord("Ashesi");
        vm.stopPrank();
    }

    function test_US6_DeployerCannotFollowSelf() public {
        // this test contract deployed the sentence and wrote word 1
        vm.expectRevert(SentenceMaker.TwoWordsInARow.selector);
        s.addWord("to");
    }

    // US7: only the owner sees who added each word
    function test_US7_ViewWords() public {
        vm.prank(ama);
        s.addWord("to");
        SentenceMaker.Word[] memory w = s.viewWords();
        assertEq(w.length, 2);
        assertEq(w[0].id, address(this));
        assertEq(w[0].word, "Akwaaba");
        assertEq(w[1].id, ama);
        assertEq(w[1].word, "to");
    }

    function test_US7_OnlyOwner() public {
        vm.prank(ama);
        vm.expectRevert(SentenceMaker.NotOwner.selector);
        s.viewWords();
    }
}
