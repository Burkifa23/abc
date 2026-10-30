// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 03: Signatures
contract SignedCoin {
    error AlreadyClaimed();
    error BadSignature();
    error InsufficientBalance(uint256 requested, uint256 available);

    event Transfer(address indexed from, address indexed to, uint256 amount);

    uint256 public constant FAUCET_AMOUNT = 40;
    // Upper limit for a "low-s" signature (half the curve order).
    uint256 private constant HALF_ORDER = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public nonces;
    mapping(address => bool) public claimed;

    function faucet() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        claimed[msg.sender] = true;
        balanceOf[msg.sender] += FAUCET_AMOUNT;
        emit Transfer(address(0), msg.sender, FAUCET_AMOUNT);
    }

    function transferHash(address from, address to, uint256 amount, uint256 nonce) public view returns (bytes32) {
        return keccak256(abi.encode(address(this), block.chainid, from, to, amount, nonce));
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recover(bytes32 digest, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
        if (uint256(s) > HALF_ORDER) revert BadSignature();
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert BadSignature();
        return signer;
    }

    function transferWithSig(address from, address to, uint256 amount, uint8 v, bytes32 r, bytes32 s) external {
        bytes32 digest = toEthSignedMessageHash(transferHash(from, to, amount, nonces[from]));
        if (recover(digest, v, r, s) != from) revert BadSignature();

        nonces[from]++;
        uint256 available = balanceOf[from];
        if (amount > available) revert InsufficientBalance(amount, available);
        balanceOf[from] = available - amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
