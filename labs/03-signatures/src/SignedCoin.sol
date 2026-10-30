// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 03: Signatures
/// Fill in every TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
contract SignedCoin {
    error AlreadyClaimed();
    error BadSignature();
    error InsufficientBalance(uint256 requested, uint256 available);

    event Transfer(address indexed from, address indexed to, uint256 amount);

    uint256 public constant FAUCET_AMOUNT = 40;
    // Upper limit for a "low-s" signature (half the curve order). Used in TODO 4.
    uint256 private constant HALF_ORDER = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public nonces;
    mapping(address => bool) public claimed;

    function faucet() external {
        // TODO 1: revert AlreadyClaimed() if msg.sender already claimed. Otherwise mark them as claimed,
        //         add FAUCET_AMOUNT to their balance, and emit Transfer(address(0), msg.sender, FAUCET_AMOUNT).
    }

    function transferHash(address from, address to, uint256 amount, uint256 nonce) public view returns (bytes32) {
        // TODO 2: return keccak256(abi.encode(address(this), block.chainid, from, to, amount, nonce)).
        //         Including this contract and the chain stops a signature being reused somewhere else.
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        // TODO 3: return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)).
        //         This is the prefix wallets add, so a signed message can never be a signed transaction.
    }

    function recover(bytes32 digest, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
        // TODO 4: revert BadSignature() if uint256(s) > HALF_ORDER (the flipped twin of a signature).
        //         Then call ecrecover(digest, v, r, s). It returns address(0) for garbage:
        //         revert BadSignature() in that case too. Otherwise return the signer.
    }

    function transferWithSig(address from, address to, uint256 amount, uint8 v, bytes32 r, bytes32 s) external {
        // TODO 5: in this order:
        //   a) digest = toEthSignedMessageHash(transferHash(from, to, amount, nonces[from]))
        //   b) if recover(digest, v, r, s) != from, revert BadSignature()
        //   c) nonces[from]++   (so the same signature cannot be used twice)
        //   d) if amount > balanceOf[from], revert InsufficientBalance(amount, balanceOf[from])
        //   e) move the coins: subtract from `from`, add to `to`
        //   f) emit Transfer(from, to, amount)
    }
}
