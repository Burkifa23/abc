// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Anonymous club access (lab 11). Constructor: `constructor()`, the deployer is the admin.
interface IClubAccess {
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

    function admin() external view returns (address);
    function isMember(bytes32 commitment) external view returns (bool);
    function used(bytes32 commitment) external view returns (bool);
    function sealedEntry(address who) external view returns (bytes32);
    function committedAt(address who) external view returns (uint256);
    function hasAccess(address who) external view returns (bool);
    function commitmentOf(bytes32 secret) external pure returns (bytes32);
    function sealFor(address who, bytes32 secret) external pure returns (bytes32);
    function addMember(bytes32 commitment) external;
    function revokeMember(bytes32 commitment) external;
    function commitEntry(bytes32 sealHash) external;
    function enter(bytes32 secret) external;
}
