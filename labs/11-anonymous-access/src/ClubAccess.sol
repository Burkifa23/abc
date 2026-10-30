// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 11: Anonymous Club Access
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. Do not rename anything here: the tests depend on these names.
contract ClubAccess {
    error NotAdmin();
    error UnknownCommitment();
    error AlreadyUsed();
    error NoPendingEntry();
    error RevealTooEarly();
    error SealMismatch();

    event MemberAdded(bytes32 indexed commitment);
    event MemberRevoked(bytes32 indexed commitment);
    event EntryCommitted(address indexed who, bytes32 sealHash);
    event AccessGranted(address indexed who);

    address public immutable admin;
    mapping(bytes32 => bool) public isMember; // commitment => active
    mapping(bytes32 => bool) public used; // commitment => spent
    mapping(address => bytes32) public sealedEntry;
    mapping(address => uint256) public committedAt;
    mapping(address => bool) public hasAccess;

    constructor() {
        admin = msg.sender; // already written
    }

    function commitmentOf(bytes32 secret) public pure returns (bytes32) {
        // TODO 1: return keccak256(abi.encodePacked(secret)).
    }

    function sealFor(address who, bytes32 secret) public pure returns (bytes32) {
        // TODO 2: return keccak256(abi.encodePacked(who, secret)).
        //         Binding the address means a copied secret is useless to anyone else.
    }

    function addMember(bytes32 commitment) external {
        // TODO 3: admin only (NotAdmin). Mark the commitment as a member and emit MemberAdded.
    }

    function revokeMember(bytes32 commitment) external {
        // TODO 4: admin only (NotAdmin). Mark the commitment as not a member and emit MemberRevoked.
    }

    function commitEntry(bytes32 sealHash) external {
        // TODO 5: remember the seal for msg.sender and the current block.number, and emit EntryCommitted.
    }

    function enter(bytes32 secret) external {
        // TODO 6: check in this order, reverting with the matching error:
        //   a) NoPendingEntry     - the sender has no sealed entry
        //   b) RevealTooEarly     - block.number is not strictly greater than the commit block
        //   c) SealMismatch       - sealFor(msg.sender, secret) is not the stored seal
        //   d) UnknownCommitment  - commitmentOf(secret) is not an active member
        //   e) AlreadyUsed        - that commitment was already spent
        // Then mark the commitment used, clear the pending entry, grant access and emit AccessGranted.
    }
}
