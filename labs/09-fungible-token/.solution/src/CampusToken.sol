// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./IERC20.sol";

/// Lab 09: Fungible Token (ERC-20)
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
        minter = msg.sender;
    }

    function name() external pure returns (string memory) {
        return "Ashesi Campus Token";
    }

    function symbol() external pure returns (string memory) {
        return "ACT";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert ERC20InvalidSpender(address(0));
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert ERC20InsufficientAllowance(msg.sender, allowed, value);
            _allowances[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert NotMinter();
        if (to == address(0)) revert ERC20InvalidReceiver(address(0));
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external {
        uint256 bal = _balances[msg.sender];
        if (bal < amount) revert ERC20InsufficientBalance(msg.sender, bal, amount);
        _balances[msg.sender] = bal - amount;
        _totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

    function _transfer(address from, address to, uint256 value) private {
        if (to == address(0)) revert ERC20InvalidReceiver(address(0));
        uint256 bal = _balances[from];
        if (bal < value) revert ERC20InsufficientBalance(from, bal, value);
        _balances[from] = bal - value;
        _balances[to] += value;
        emit Transfer(from, to, value);
    }
}
