// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IClubAccess} from "./interfaces/IClubAccess.sol";

/// @title ClubAccess
/// @notice Members prove they know a secret without revealing it up front (commit, then reveal).
contract ClubAccess is IClubAccess {
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

    /// @notice The deployer becomes the admin.
    constructor() {
        admin = msg.sender;
    }

    /// @notice The public commitment for a secret.
    function commitmentOf(bytes32 secret) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(secret));
    }

    /// @notice The seal that binds a secret to one address, so a copied secret is useless to anyone else.
    function sealFor(address who, bytes32 secret) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(who, secret));
    }

    /// @notice Adds a member by commitment. Admin only.
    function addMember(bytes32 commitment) external onlyAdmin {
        isMember[commitment] = true;
        emit MemberAdded(commitment);
    }

    /// @notice Removes a member by commitment. Admin only.
    function revokeMember(bytes32 commitment) external onlyAdmin {
        isMember[commitment] = false;
        emit MemberRevoked(commitment);
    }

    /// @notice Step one: commit to an entry attempt without showing the secret.
    function commitEntry(bytes32 sealHash) external {
        sealedEntry[msg.sender] = sealHash;
        committedAt[msg.sender] = block.number;
        emit EntryCommitted(msg.sender, sealHash);
    }

    /// @notice Step two, in a later block: reveal the secret and get access.
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
