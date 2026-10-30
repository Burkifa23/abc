// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC165} from "./interfaces/IERC165.sol";
import {IERC721} from "./interfaces/IERC721.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {IERC721Receiver} from "./interfaces/IERC721Receiver.sol";

/// Facilitator reference. Learners: try first, peek later.
contract ConcertTickets is IERC721, IERC721Metadata {
    error ERC721NonexistentToken(uint256 tokenId);
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
    error ERC721InsufficientApproval(address operator, uint256 tokenId);
    error ERC721InvalidReceiver(address receiver);
    error SoldOut();
    error WrongPrice();
    error NotOrganizer();
    error WithdrawFailed();

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant PRICE = 0.02 ether;

    address public immutable organizer;
    uint256 public totalMinted;
    string public baseURI;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _approved;
    mapping(address => mapping(address => bool)) private _operators;

    constructor(string memory baseURI_) {
        organizer = msg.sender;
        baseURI = baseURI_;
    }

    // ---- metadata ----

    function name() external pure returns (string memory) {
        return "Ashesi Live";
    }

    function symbol() external pure returns (string memory) {
        return "TIX";
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 || id == 0x80ac58cd || id == 0x5b5e139f;
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        ownerOf(id); // reverts for a nonexistent token
        return string.concat(baseURI, _toString(id), ".json");
    }

    // ---- selling ----

    function buyTicket() external payable returns (uint256 id) {
        if (msg.value != PRICE) revert WrongPrice();
        if (totalMinted >= MAX_SUPPLY) revert SoldOut();
        id = ++totalMinted;
        _owners[id] = msg.sender;
        _balances[msg.sender] += 1;
        emit Transfer(address(0), msg.sender, id);
    }

    function withdraw() external {
        if (msg.sender != organizer) revert NotOrganizer();
        (bool ok,) = organizer.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    // ---- ownership ----

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 id) public view returns (address owner) {
        owner = _owners[id];
        if (owner == address(0)) revert ERC721NonexistentToken(id);
    }

    // ---- approvals ----

    function approve(address to, uint256 id) external {
        address owner = ownerOf(id);
        if (msg.sender != owner && !_operators[owner][msg.sender]) revert ERC721InsufficientApproval(msg.sender, id);
        _approved[id] = to;
        emit Approval(owner, to, id);
    }

    function getApproved(uint256 id) external view returns (address) {
        ownerOf(id);
        return _approved[id];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operators[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operators[owner][operator];
    }

    // ---- transfers ----

    function transferFrom(address from, address to, uint256 id) public {
        if (to == address(0)) revert ERC721InvalidReceiver(address(0));
        address owner = ownerOf(id);
        if (!_isAuthorized(owner, msg.sender, id)) revert ERC721InsufficientApproval(msg.sender, id);
        if (owner != from) revert ERC721IncorrectOwner(from, id, owner);
        _transfer(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        safeTransferFrom(from, to, id, "");
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes memory data) public {
        transferFrom(from, to, id);
        _checkReceiver(from, to, id, data);
    }

    // ---- helpers ----

    function _isAuthorized(address owner, address spender, uint256 id) internal view returns (bool) {
        return spender == owner || _operators[owner][spender] || _approved[id] == spender;
    }

    function _transfer(address from, address to, uint256 id) internal {
        delete _approved[id];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[id] = to;
        emit Transfer(from, to, id);
    }

    function _checkReceiver(address from, address to, uint256 id, bytes memory data) internal {
        if (to.code.length == 0) return;
        try IERC721Receiver(to).onERC721Received(msg.sender, from, id, data) returns (bytes4 retval) {
            if (retval != IERC721Receiver.onERC721Received.selector) revert ERC721InvalidReceiver(to);
        } catch {
            revert ERC721InvalidReceiver(to);
        }
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
