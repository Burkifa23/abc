// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// A contract must implement this to accept tokens sent with safeTransferFrom.
interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}
