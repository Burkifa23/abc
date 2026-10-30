// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SignedCoin} from "../src/SignedCoin.sol";

contract SignedCoinTest is Test {
    SignedCoin coin;
    address ama;
    uint256 amaPk;
    address kofi;
    uint256 kofiPk;
    address esi = makeAddr("esi"); // the relayer

    // secp256k1 group order
    uint256 constant N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    function setUp() public {
        coin = new SignedCoin();
        (ama, amaPk) = makeAddrAndKey("ama");
        (kofi, kofiPk) = makeAddrAndKey("kofi");
        vm.prank(ama);
        coin.faucet();
    }

    /// Sign "from -> to, amt" for from's current nonce.
    function _sign(uint256 pk, address from, address to, uint256 amt) internal view returns (uint8, bytes32, bytes32) {
        bytes32 d = coin.toEthSignedMessageHash(coin.transferHash(from, to, amt, coin.nonces(from)));
        return vm.sign(pk, d);
    }

    function test_01_FaucetGives40() public {
        vm.prank(kofi);
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), kofi, 40);
        coin.faucet();
        assertEq(coin.balanceOf(kofi), 40);
        assertEq(coin.balanceOf(ama), 40);
    }

    function test_02_FaucetOnce() public {
        vm.prank(ama);
        vm.expectRevert(SignedCoin.AlreadyClaimed.selector);
        coin.faucet();
    }

    function test_03_TransferHashBindsEverything() public view {
        bytes32 h = coin.transferHash(ama, kofi, 5, 0);
        assertEq(h, keccak256(abi.encode(address(coin), block.chainid, ama, kofi, uint256(5), uint256(0))));
        assertTrue(h != coin.transferHash(ama, kofi, 6, 0));
    }

    function test_04_EthSignedHash() public view {
        bytes32 h = keccak256("hello");
        assertEq(
            coin.toEthSignedMessageHash(h), keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h))
        );
    }

    function test_05_RecoversSigner() public view {
        bytes32 d = keccak256("hello");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(amaPk, d);
        assertEq(coin.recover(d, v, r, s), ama);
    }

    function test_06_RelayedTransfer() public {
        (uint8 v, bytes32 r, bytes32 s) = _sign(amaPk, ama, kofi, 5);

        vm.expectEmit(true, true, false, true);
        emit Transfer(ama, kofi, 5);
        vm.prank(esi);
        coin.transferWithSig(ama, kofi, 5, v, r, s);

        assertEq(coin.balanceOf(ama), 35);
        assertEq(coin.balanceOf(kofi), 5);
        assertEq(coin.nonces(ama), 1);
    }

    function test_07_RejectsWrongSigner() public {
        (uint8 v, bytes32 r, bytes32 s) = _sign(kofiPk, ama, kofi, 5); // kofi signs, claiming to be ama
        vm.prank(esi);
        vm.expectRevert(SignedCoin.BadSignature.selector);
        coin.transferWithSig(ama, kofi, 5, v, r, s);
    }

    function test_07b_RejectsHighS() public {
        (uint8 v, bytes32 r, bytes32 s) = _sign(amaPk, ama, kofi, 5);
        // The "twin" signature: s' = n - s and the opposite parity of v. It recovers the same signer.
        bytes32 highS = bytes32(N - uint256(s));
        uint8 flippedV = v == 27 ? 28 : 27;
        vm.prank(esi);
        vm.expectRevert(SignedCoin.BadSignature.selector);
        coin.transferWithSig(ama, kofi, 5, flippedV, r, highS);
    }

    function test_07c_ZeroSignerRejected() public {
        vm.expectRevert(SignedCoin.BadSignature.selector);
        coin.recover(keccak256("hello"), 27, bytes32(0), bytes32(0));
    }

    function test_08_RejectsReplay() public {
        (uint8 v, bytes32 r, bytes32 s) = _sign(amaPk, ama, kofi, 5);
        vm.startPrank(esi);
        coin.transferWithSig(ama, kofi, 5, v, r, s);
        vm.expectRevert(SignedCoin.BadSignature.selector);
        coin.transferWithSig(ama, kofi, 5, v, r, s);
        vm.stopPrank();
    }

    function test_08b_RejectsOtherChain() public {
        (uint8 v, bytes32 r, bytes32 s) = _sign(amaPk, ama, kofi, 5);
        vm.chainId(999);
        vm.prank(esi);
        vm.expectRevert(SignedCoin.BadSignature.selector);
        coin.transferWithSig(ama, kofi, 5, v, r, s);
    }

    function test_09_RejectsOverspend() public {
        (uint8 v, bytes32 r, bytes32 s) = _sign(amaPk, ama, kofi, 50);
        vm.prank(esi);
        vm.expectRevert(abi.encodeWithSelector(SignedCoin.InsufficientBalance.selector, 50, 40));
        coin.transferWithSig(ama, kofi, 50, v, r, s);
    }
}
