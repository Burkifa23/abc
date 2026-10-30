// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "./interfaces/IERC721.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";

/// Lab 15: University Certification NFT
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. Do not rename anything here: the tests depend on these names.
contract Certificates is IERC721, IERC721Metadata, IERC5192 {
    struct Certificate {
        address student;
        uint16 year;
        string uri;
    }

    error NotUniversity();
    error Soulbound();
    error InvalidYear(uint16 year);
    error ERC721NonexistentToken(uint256 id);
    error ERC721InvalidReceiver(address receiver);

    event Issued(uint256 indexed id, address indexed student, uint16 year);
    event Revoked(uint256 indexed id);

    address public immutable university;

    uint256 private _lastId; // ids start at 1
    mapping(uint256 => Certificate) private _certs; // student == address(0) means "no such certificate"
    mapping(address => uint256[]) private _owned; // student => their certificate ids, in issue order

    constructor() {
        university = msg.sender; // already written
    }

    // ---- issuing and revoking ----

    function issue(address student, uint16 year, string calldata uri) external returns (uint256 id) {
        // US1: only the university (NotUniversity).
        // US2: revert ERC721InvalidReceiver(address(0)) for the zero address, and InvalidYear(year) unless 2002 <= year <= 2100.
        //      Give the next id (starting at 1) to the student, store the certificate, add the id to their list,
        //      then emit Transfer(address(0), student, id), Locked(id) and Issued(id, student, year), in that order.
    }

    function revoke(uint256 id) external {
        // US6: only the university (NotUniversity). Revert ERC721NonexistentToken(id) if there is no such certificate.
        //      Remove the id from the student's list (hint: swap-and-pop), delete the certificate,
        //      then emit Transfer(student, address(0), id) and Revoked(id).
    }

    // ---- reading ----

    function certificate(uint256 id) external view returns (Certificate memory) {
        // US3: return the stored certificate, or revert ERC721NonexistentToken(id).
    }

    function certificateName(uint256 id) external view returns (string memory) {
        // US3: return "ASH-" followed by the year, e.g. "ASH-2026". You need a number-to-text helper (see _toString below).
    }

    function certificatesOf(address owner) external view returns (uint256[] memory) {
        // US5: return the ids of the owner's certificates.
    }

    function locked(uint256 id) external view returns (bool) {
        // US4: every existing certificate is locked (true). Revert ERC721NonexistentToken(id) for an unknown id.
    }

    function name() external pure returns (string memory) {
        // US2: return "Ashesi University Certificates".
    }

    function symbol() external pure returns (string memory) {
        // US2: return "ASHU".
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        // US2: return the uri stored when the certificate was issued, or revert ERC721NonexistentToken(id).
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // US7: true for 0x01ffc9a7 (ERC-165), 0x80ac58cd (ERC-721), 0x5b5e139f (ERC-721 Metadata) and 0xb45a3c0e (ERC-5192).
    }

    // ---- ERC-721 reads ----

    function balanceOf(address owner) external view returns (uint256) {
        // US2: how many certificates the owner holds.
    }

    function ownerOf(uint256 id) external view returns (address) {
        // US2: the student who holds the certificate, or revert ERC721NonexistentToken(id).
    }

    function getApproved(uint256 id) external view returns (address) {
        // US4: nothing is ever approved. Return address(0), but revert ERC721NonexistentToken(id) for an unknown id.
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        // US4: nobody is ever an operator. Return false.
    }

    // ---- ERC-721 writes: every one of them must revert Soulbound() ----

    function approve(address to, uint256 id) external {
        // US4: revert Soulbound().
    }

    function setApprovalForAll(address operator, bool approved) external {
        // US4: revert Soulbound().
    }

    function transferFrom(address from, address to, uint256 id) external {
        // US4: revert Soulbound().
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        // US4: revert Soulbound().
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes calldata data) external {
        // US4: revert Soulbound().
    }

    // ---- helpers (add your own) ----

    function _toString(uint256 value) internal pure returns (string memory) {
        // TODO: turn a number into its decimal text, e.g. 2026 -> "2026" (0 -> "0").
        //       Hint: count the digits, then fill a `bytes` buffer from the end using value % 10 and bytes1(uint8(48 + digit)).
    }
}
