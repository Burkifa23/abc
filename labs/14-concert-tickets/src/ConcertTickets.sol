// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC165} from "./interfaces/IERC165.sol";
import {IERC721} from "./interfaces/IERC721.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";
import {IERC721Receiver} from "./interfaces/IERC721Receiver.sol";

/// Lab 14: Concert Tickets (ERC-721)
/// Fill in every function marked TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
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

    // Token ids start at 1. An id nobody owns has owner address(0).
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _approved; // tokenId => the one approved address
    mapping(address => mapping(address => bool)) private _operators; // owner => operator => approved for all

    constructor(string memory baseURI_) {
        organizer = msg.sender; // already written
        baseURI = baseURI_;
    }

    // ---- metadata ----

    function name() external pure returns (string memory) {
        // TODO 1: return "Ashesi Live".
    }

    function symbol() external pure returns (string memory) {
        // TODO 1: return "TIX".
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        // TODO 2: return true for the three ids: 0x01ffc9a7 (ERC-165), 0x80ac58cd (ERC-721), 0x5b5e139f (ERC-721 Metadata).
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        // TODO 11: revert (via ownerOf) if the token does not exist.
        //          Return string.concat(baseURI, _toString(id), ".json").
    }

    // ---- selling ----

    function buyTicket() external payable returns (uint256 id) {
        // TODO 4: revert WrongPrice() unless msg.value is exactly PRICE.
        // TODO 5: revert SoldOut() if totalMinted is already MAX_SUPPLY.
        // TODO 3: the new id is ++totalMinted. Give it to msg.sender (owner and balance) and emit Transfer(address(0), msg.sender, id).
    }

    function withdraw() external {
        // TODO 12: only the organizer (NotOrganizer). Send the whole balance to the organizer with call; revert WithdrawFailed() if it fails.
    }

    // ---- ownership ----

    function balanceOf(address owner) external view returns (uint256) {
        // TODO 6: return how many tokens the owner holds.
    }

    function ownerOf(uint256 id) public view returns (address owner) {
        // TODO 6: return the owner. If there is none (address(0)), revert ERC721NonexistentToken(id).
    }

    // ---- approvals ----

    function approve(address to, uint256 id) external {
        // TODO 8: only the owner or an operator approved for all may approve (else ERC721InsufficientApproval(msg.sender, id)).
        //         Save `to` as the approved address for the token and emit Approval(owner, to, id).
    }

    function getApproved(uint256 id) external view returns (address) {
        // TODO 8: revert if the token does not exist; otherwise return its approved address.
    }

    function setApprovalForAll(address operator, bool approved) external {
        // TODO 9: record that msg.sender allows (or no longer allows) `operator`, and emit ApprovalForAll.
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        // TODO 9: return the flag recorded above.
    }

    // ---- transfers ----

    function transferFrom(address from, address to, uint256 id) public {
        // TODO 7: revert ERC721InvalidReceiver(address(0)) if `to` is the zero address.
        //         Look up the owner (ownerOf). Revert ERC721InsufficientApproval(msg.sender, id) unless _isAuthorized.
        //         Revert ERC721IncorrectOwner(from, id, owner) if `from` is not the owner. Then call _transfer.
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        // TODO 10: same as the 4-argument version with empty data.
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes memory data) public {
        // TODO 10: do the transfer (transferFrom), then call _checkReceiver.
    }

    // ---- helpers ----

    function _isAuthorized(address owner, address spender, uint256 id) internal view returns (bool) {
        // TODO 7: true if spender is the owner, an operator approved for all by the owner, or the approved address of this token.
    }

    function _transfer(address from, address to, uint256 id) internal {
        // TODO 7: clear the token's approval (TODO 8 tests it), move one from from's balance to to's balance,
        //         set the new owner and emit Transfer(from, to, id).
    }

    function _checkReceiver(address from, address to, uint256 id, bytes memory data) internal {
        // TODO 10: if `to` is a contract (to.code.length > 0), call IERC721Receiver(to).onERC721Received(msg.sender, from, id, data).
        //          Use try/catch. Revert ERC721InvalidReceiver(to) if the call fails or does not return the function's own selector.
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        // TODO 11: turn a number into its decimal text, e.g. 42 -> "42" (0 -> "0").
        //          Hint: count the digits, then fill a `bytes` buffer from the end using value % 10 and bytes1(uint8(48 + digit)).
    }
}
