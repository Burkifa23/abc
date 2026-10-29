// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Election} from "../src/Election.sol";

contract ElectionTest is Test {
    Election election;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory");

    event Voted(address indexed voter, uint256 indexed candidateId);

    function setUp() public {
        string[] memory names = new string[](3);
        names[0] = "Ama";
        names[1] = "Kofi";
        names[2] = "Esi";
        election = new Election(names);
    }

    function test_01_DeployerIsAdmin() public view {
        assertEq(election.admin(), address(this));
    }

    function test_02_StoresCandidates() public view {
        (string memory name, uint256 votes) = election.candidates(1);
        assertEq(name, "Kofi");
        assertEq(votes, 0);
    }

    function test_03_CountsCandidates() public view {
        assertEq(election.candidateCount(), 3);
    }

    function test_04_OnlyAdminCanRegister() public {
        vm.prank(mallory);
        vm.expectRevert(Election.NotAdmin.selector);
        election.registerVoter(mallory);
    }

    function test_05_AdminCanRegister() public {
        election.registerVoter(alice);
        assertTrue(election.isRegistered(alice));
        assertFalse(election.isRegistered(bob));
    }

    function test_06_UnregisteredCannotVote() public {
        vm.prank(mallory);
        vm.expectRevert(Election.NotRegistered.selector);
        election.vote(0);
    }

    function test_07_CannotVoteTwice() public {
        election.registerVoter(alice);
        vm.startPrank(alice);
        election.vote(0);
        vm.expectRevert(Election.AlreadyVoted.selector);
        election.vote(1);
        vm.stopPrank();
    }

    function test_08_RejectsInvalidCandidate() public {
        election.registerVoter(alice);
        vm.prank(alice);
        vm.expectRevert(Election.InvalidCandidate.selector);
        election.vote(3);
    }

    function test_09_VoteIsCountedAndEmitted() public {
        election.registerVoter(alice);
        vm.expectEmit(true, true, false, false);
        emit Voted(alice, 2);
        vm.prank(alice);
        election.vote(2);

        (, uint256 votes) = election.candidates(2);
        assertEq(votes, 1);
        assertTrue(election.hasVoted(alice));
    }

    function test_10_WinnerHasMostVotes() public {
        election.registerVoter(alice);
        election.registerVoter(bob);
        election.registerVoter(mallory);
        vm.prank(alice);
        election.vote(1);
        vm.prank(bob);
        election.vote(1);
        vm.prank(mallory);
        election.vote(2);
        assertEq(election.winner(), "Kofi");
    }

    function test_10_TieGoesToLowerId() public {
        election.registerVoter(alice);
        election.registerVoter(bob);
        vm.prank(alice);
        election.vote(2);
        vm.prank(bob);
        election.vote(1);
        assertEq(election.winner(), "Kofi");
    }
}
