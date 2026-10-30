// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./IERC20.sol";

/// Lab 09: Fungible Token (ERC-20)
/// Fill in every TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
contract CampusToken is IERC20 {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InvalidSpender(address spender);
    error NotMinter();

    address public immutable minter;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor() {
        minter = msg.sender; // already written
    }

    function name() external pure returns (string memory) {
        // TODO 1a: return "Ashesi Campus Token".
    }

    function symbol() external pure returns (string memory) {
        // TODO 1b: return "ACT".
    }

    function decimals() external pure returns (uint8) {
        // TODO 1c: return 18.
    }

    function totalSupply() external view returns (uint256) {
        // TODO 3a: return the total supply.
    }

    function balanceOf(address account) external view returns (uint256) {
        // TODO 3b: return the account's balance.
    }

    function transfer(address to, uint256 value) external returns (bool) {
        // TODO 5/6: send `value` from msg.sender to `to`.
        //   - revert ERC20InvalidReceiver(address(0)) if `to` is the zero address
        //   - revert ERC20InsufficientBalance(msg.sender, balance, value) if the balance is too low
        //   - move the tokens, emit Transfer(msg.sender, to, value) (even when value is 0), return true
        // Tip: put this in a private helper `_transfer(from, to, value)`. transferFrom will reuse it (step 8).
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        // TODO 7a: how much `spender` may still spend from `owner`.
    }

    function approve(address spender, uint256 value) external returns (bool) {
        // TODO 7b: revert ERC20InvalidSpender(address(0)) for the zero address.
        //          Set (overwrite, not add) the allowance, emit Approval(msg.sender, spender, value), return true.
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        // TODO 8/9: the spender is msg.sender.
        //   - if the allowance is type(uint256).max, leave it alone (infinite allowance)
        //   - otherwise revert ERC20InsufficientAllowance(msg.sender, allowance, value) if too low, then lower it
        //   - then move the tokens from `from` to `to` like transfer, and return true
    }

    function mint(address to, uint256 amount) external {
        // TODO 3c: only `minter` may mint (revert NotMinter()). Revert ERC20InvalidReceiver for the zero address.
        //          Increase the supply and the balance, emit Transfer(address(0), to, amount).
    }

    function burn(uint256 amount) external {
        // TODO 4: revert ERC20InsufficientBalance(msg.sender, balance, amount) if too low.
        //         Lower the balance and the supply, emit Transfer(msg.sender, address(0), amount).
    }
}
