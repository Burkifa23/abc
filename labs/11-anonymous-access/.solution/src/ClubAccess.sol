// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 11: Anonymous Club Access
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

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Both values packed below are fixed-size (bytes32, address), so encodePacked cannot collide.
    function commitmentOf(bytes32 secret) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(secret));
    }

    function sealFor(address who, bytes32 secret) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(who, secret));
    }

    function addMember(bytes32 commitment) external onlyAdmin {
        isMember[commitment] = true;
        emit MemberAdded(commitment);
    }

    function revokeMember(bytes32 commitment) external onlyAdmin {
        isMember[commitment] = false;
        emit MemberRevoked(commitment);
    }

    function commitEntry(bytes32 sealHash) external {
        sealedEntry[msg.sender] = sealHash;
        committedAt[msg.sender] = block.number;
        emit EntryCommitted(msg.sender, sealHash);
    }

    function enter(bytes32 secret) external {
        bytes32 pending = sealedEntry[msg.sender];
        if (pending == bytes32(0)) revert NoPendingEntry();
        if (block.number <= committedAt[msg.sender]) revert RevealTooEarly();
        if (sealFor(msg.sender, secret) != pending) revert SealMismatch();

        bytes32 commitment = commitmentOf(secret);
        if (!isMember[commitment]) revert UnknownCommitment();
        if (used[commitment]) revert AlreadyUsed();

        used[commitment] = true;
        delete sealedEntry[msg.sender];
        hasAccess[msg.sender] = true;
        emit AccessGranted(msg.sender);
    }
}
