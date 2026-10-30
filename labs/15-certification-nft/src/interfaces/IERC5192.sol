// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// ERC-5192: minimal soulbound NFTs. A locked token cannot be transferred.
/// Interface id: 0xb45a3c0e.
interface IERC5192 {
    event Locked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}
