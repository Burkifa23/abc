// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// ERC-165: lets a contract announce which interfaces it supports.
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
