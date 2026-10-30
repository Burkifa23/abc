// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "./interfaces/IERC721.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";

/// Facilitator reference. Learners: try first, peek later.
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

    uint256 private _lastId;
    mapping(uint256 => Certificate) private _certs; // student == address(0) means "no such certificate"
    mapping(address => uint256[]) private _owned; // student => certificate ids

    constructor() {
        university = msg.sender;
    }

    // ---- issuing and revoking ----

    function issue(address student, uint16 year, string calldata uri) external returns (uint256 id) {
        if (msg.sender != university) revert NotUniversity();
        if (student == address(0)) revert ERC721InvalidReceiver(address(0));
        if (year < 2002 || year > 2100) revert InvalidYear(year);
        id = ++_lastId;
        _certs[id] = Certificate(student, year, uri);
        _owned[student].push(id);
        emit Transfer(address(0), student, id);
        emit Locked(id);
        emit Issued(id, student, year);
    }

    function revoke(uint256 id) external {
        if (msg.sender != university) revert NotUniversity();
        address student = _exists(id);
        uint256[] storage list = _owned[student];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == id) {
                list[i] = list[list.length - 1]; // swap-and-pop
                list.pop();
                break;
            }
        }
        delete _certs[id];
        emit Transfer(student, address(0), id);
        emit Revoked(id);
    }

    // ---- reading ----

    function certificate(uint256 id) external view returns (Certificate memory) {
        _exists(id);
        return _certs[id];
    }

    function certificateName(uint256 id) external view returns (string memory) {
        _exists(id);
        return string.concat("ASH-", _toString(_certs[id].year));
    }

    function certificatesOf(address owner) external view returns (uint256[] memory) {
        return _owned[owner];
    }

    function locked(uint256 id) external view returns (bool) {
        _exists(id);
        return true;
    }

    function name() external pure returns (string memory) {
        return "Ashesi University Certificates";
    }

    function symbol() external pure returns (string memory) {
        return "ASHU";
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        _exists(id);
        return _certs[id].uri;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 // ERC-165
            || interfaceId == 0x80ac58cd // ERC-721
            || interfaceId == 0x5b5e139f // ERC-721 Metadata
            || interfaceId == 0xb45a3c0e; // ERC-5192
    }

    // ---- ERC-721 reads ----

    function balanceOf(address owner) external view returns (uint256) {
        return _owned[owner].length;
    }

    function ownerOf(uint256 id) external view returns (address) {
        return _exists(id);
    }

    function getApproved(uint256 id) external view returns (address) {
        _exists(id);
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // ---- ERC-721 writes: all blocked ----

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert Soulbound();
    }

    // ---- helpers ----

    /// Returns the student who holds `id`, or reverts if there is no such certificate.
    function _exists(uint256 id) internal view returns (address student) {
        student = _certs[id].student;
        if (student == address(0)) revert ERC721NonexistentToken(id);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 digits;
        for (uint256 t = value; t != 0; t /= 10) digits++;
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
