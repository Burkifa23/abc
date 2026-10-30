// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FortuneTeller} from "../src/FortuneTeller.sol";

contract FortuneTellerTest is Test {
    FortuneTeller teller;
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");

    event FortuneTold(address indexed asker, string question, string answer);

    function _answers() internal pure returns (string[] memory a) {
        a = new string[](6);
        a[0] = "Yes";
        a[1] = "No";
        a[2] = "Ask again later";
        a[3] = "Definitely";
        a[4] = "Very doubtful";
        a[5] = "It is certain";
    }

    function setUp() public {
        teller = new FortuneTeller(_answers());
    }

    function _isAnswer(string memory s) internal view returns (bool) {
        string[] memory all = teller.viewAnswers();
        for (uint256 i = 0; i < all.length; i++) {
            if (keccak256(bytes(all[i])) == keccak256(bytes(s))) return true;
        }
        return false;
    }

    // US1
    function test_US1_Answers() public view {
        assertEq(teller.viewAnswers().length, 6);
    }

    function test_US1_TooFew() public {
        string[] memory five = new string[](5);
        for (uint256 i = 0; i < 5; i++) five[i] = "Maybe";
        vm.expectRevert(FortuneTeller.NotEnoughAnswers.selector);
        new FortuneTeller(five);
    }

    function test_US1_EmptyAnswer() public {
        string[] memory a = _answers();
        a[3] = "";
        vm.expectRevert(FortuneTeller.EmptyAnswer.selector);
        new FortuneTeller(a);
    }

    // US2
    function test_US2_ViewAnswers() public view {
        string[] memory got = teller.viewAnswers();
        string[] memory want = _answers();
        for (uint256 i = 0; i < 6; i++) {
            assertEq(got[i], want[i]);
        }
    }

    // US3
    function test_US3_GetFortune() public {
        vm.expectEmit(true, false, false, false); // only the asker is known in advance
        emit FortuneTold(ama, "", "");
        vm.prank(ama);
        string memory answer = teller.getFortune("Will I pass Solidity?");
        assertTrue(_isAnswer(answer));
        FortuneTeller.Fortune[] memory qs = teller.viewQuestions();
        assertEq(qs.length, 1);
        assertEq(qs[0].asker, ama);
        assertEq(qs[0].question, "Will I pass Solidity?");
        assertEq(qs[0].answer, answer);
    }

    function test_US3_EmptyQuestion() public {
        vm.expectRevert(FortuneTeller.EmptyQuestion.selector);
        teller.getFortune("");
    }

    // US4
    function test_US4_ViewQuestions() public {
        vm.prank(ama);
        string memory a1 = teller.getFortune("Will it rain?");
        vm.prank(kofi);
        string memory a2 = teller.getFortune("Will Ashesi win?");
        FortuneTeller.Fortune[] memory qs = teller.viewQuestions();
        assertEq(qs.length, 2);
        assertEq(qs[0].asker, ama);
        assertEq(qs[0].question, "Will it rain?");
        assertEq(qs[0].answer, a1);
        assertEq(qs[1].asker, kofi);
        assertEq(qs[1].question, "Will Ashesi win?");
        assertEq(qs[1].answer, a2);
    }
}
