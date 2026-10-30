// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ClubAccess} from "../src/ClubAccess.sol";

contract ClubAccessTest is Test {
    ClubAccess club;
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address mallory = makeAddr("mallory");

    bytes32 amaSecret = keccak256("ama's card");
    bytes32 kofiSecret = keccak256("kofi's card");

    event MemberAdded(bytes32 indexed commitment);
    event EntryCommitted(address indexed who, bytes32 sealHash);
    event AccessGranted(address indexed who);

    function setUp() public {
        club = new ClubAccess();
        club.addMember(club.commitmentOf(amaSecret));
    }

    function _commit(address who, bytes32 secret) internal {
        // Compute first: vm.prank applies to the next external call, which would otherwise be sealFor.
        bytes32 sealHash = club.sealFor(who, secret);
        vm.prank(who);
        club.commitEntry(sealHash);
    }

    // US1
    function test_US1_AddMember() public {
        bytes32 c = club.commitmentOf(kofiSecret);
        vm.expectEmit(true, false, false, false);
        emit MemberAdded(c);
        club.addMember(c);
        assertTrue(club.isMember(c));
    }

    function test_US1_OnlyAdmin() public {
        vm.startPrank(mallory);
        vm.expectRevert(ClubAccess.NotAdmin.selector);
        club.addMember(bytes32(uint256(1)));
        vm.expectRevert(ClubAccess.NotAdmin.selector);
        club.revokeMember(bytes32(uint256(1)));
        vm.stopPrank();
    }

    // US2
    function test_US2_Helpers() public view {
        assertEq(club.commitmentOf(amaSecret), keccak256(abi.encodePacked(amaSecret)));
        assertEq(club.sealFor(ama, amaSecret), keccak256(abi.encodePacked(ama, amaSecret)));
        assertTrue(club.sealFor(ama, amaSecret) != club.sealFor(kofi, amaSecret));
    }

    // US3
    function test_US3_Commit() public {
        bytes32 s = club.sealFor(ama, amaSecret);
        vm.expectEmit(true, false, false, true);
        emit EntryCommitted(ama, s);
        vm.prank(ama);
        club.commitEntry(s);
        assertEq(club.sealedEntry(ama), s);
        assertEq(club.committedAt(ama), block.number);
    }

    // US4
    function test_US4_Enter() public {
        _commit(ama, amaSecret);
        vm.roll(block.number + 1);
        vm.expectEmit(true, false, false, false);
        emit AccessGranted(ama);
        vm.prank(ama);
        club.enter(amaSecret);
        assertTrue(club.hasAccess(ama));
        assertTrue(club.used(club.commitmentOf(amaSecret)));
    }

    function test_US4_SameBlock() public {
        _commit(ama, amaSecret);
        vm.prank(ama);
        vm.expectRevert(ClubAccess.RevealTooEarly.selector);
        club.enter(amaSecret);
    }

    function test_US4_NoCommit() public {
        vm.prank(ama);
        vm.expectRevert(ClubAccess.NoPendingEntry.selector);
        club.enter(amaSecret);
    }

    function test_US4_WrongSecret() public {
        _commit(ama, amaSecret);
        vm.roll(block.number + 1);
        vm.prank(ama);
        vm.expectRevert(ClubAccess.SealMismatch.selector);
        club.enter(kofiSecret);
    }

    function test_US4_FrontRunFails() public {
        // mallory sees ama's enter(amaSecret) in the mempool, but her own sealed commit
        // was made before she knew the secret, so it cannot match.
        _commit(ama, amaSecret);
        _commit(mallory, bytes32("a lucky guess"));
        vm.roll(block.number + 1);

        vm.prank(mallory);
        vm.expectRevert(ClubAccess.SealMismatch.selector);
        club.enter(amaSecret);
        assertFalse(club.hasAccess(mallory));

        vm.prank(ama);
        club.enter(amaSecret);
        assertTrue(club.hasAccess(ama));
    }

    // US5
    function test_US5_OneUse() public {
        _commit(ama, amaSecret);
        _commit(kofi, amaSecret); // kofi was handed a copy of ama's credential
        vm.roll(block.number + 1);

        vm.prank(ama);
        club.enter(amaSecret);

        vm.prank(kofi);
        vm.expectRevert(ClubAccess.AlreadyUsed.selector);
        club.enter(amaSecret);
    }

    // US6
    function test_US6_Revoke() public {
        bytes32 c = club.commitmentOf(amaSecret);
        club.revokeMember(c);
        assertFalse(club.isMember(c));
    }

    function test_US6_RevokedCannotEnter() public {
        _commit(ama, amaSecret);
        club.revokeMember(club.commitmentOf(amaSecret));
        vm.roll(block.number + 1);
        vm.prank(ama);
        vm.expectRevert(ClubAccess.UnknownCommitment.selector);
        club.enter(amaSecret);
    }

    // US7
    function test_US7_NotAMember() public {
        _commit(mallory, bytes32("not on the list"));
        vm.roll(block.number + 1);
        vm.prank(mallory);
        vm.expectRevert(ClubAccess.UnknownCommitment.selector);
        club.enter(bytes32("not on the list"));
    }
}
