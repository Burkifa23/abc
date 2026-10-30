// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MiniChain} from "../src/MiniChain.sol";

contract MiniChainHarness is MiniChain {
    constructor(uint8 bits) MiniChain(bits) {}

    function tamper(uint256 i, uint256 j, string memory t) external {
        blocks[i].transactions[j] = t;
    }
}

contract MiniChainTest is Test {
    MiniChain chain;

    event TransactionAdded(uint256 indexed poolIndex, string transaction);
    event BlockMined(uint256 indexed index, bytes32 hash);

    function setUp() public {
        chain = new MiniChain(8);
    }

    function _findNonce(MiniChain c, bytes32 prev, string[] memory txs) internal view returns (uint256 n) {
        while (!c.meetsDifficulty(c.hashBlock(prev, n, txs))) n++;
    }

    function _findBadNonce(MiniChain c, bytes32 prev, string[] memory txs) internal view returns (uint256 n) {
        while (c.meetsDifficulty(c.hashBlock(prev, n, txs))) n++;
    }

    function _mine(MiniChain c) internal {
        c.mine(_findNonce(c, c.lastHash(), c.pendingTransactions()));
    }

    function test_01_HasGenesisBlock() public view {
        assertEq(chain.blockCount(), 1);
        MiniChain.Block memory g = chain.getBlock(0);
        assertEq(g.hash, bytes32(0));
        assertEq(g.previousHash, bytes32(0));
        assertEq(g.transactions.length, 0);
    }

    function test_02_AddsToPool() public {
        vm.expectEmit(true, false, false, true);
        emit TransactionAdded(0, "Ama pays Kofi 5");
        chain.addTransaction("Ama pays Kofi 5");

        vm.expectEmit(true, false, false, true);
        emit TransactionAdded(1, "Kofi pays Esi 2");
        chain.addTransaction("Kofi pays Esi 2");

        string[] memory p = chain.pendingTransactions();
        assertEq(p.length, 2);
        assertEq(p[0], "Ama pays Kofi 5");
        assertEq(p[1], "Kofi pays Esi 2");
    }

    function test_03_HashesBlockData() public view {
        string[] memory txs = new string[](1);
        txs[0] = "Ama pays Kofi 5";
        bytes32 p = keccak256("prev");
        assertEq(chain.hashBlock(p, 7, txs), keccak256(abi.encode(p, uint256(7), txs)));

        string[] memory other = new string[](1);
        other[0] = "Ama pays Kofi 6";
        assertTrue(chain.hashBlock(p, 7, txs) != chain.hashBlock(p, 7, other));
    }

    function test_04_ChecksDifficulty() public view {
        assertTrue(chain.meetsDifficulty(bytes32(uint256(1))));
        assertFalse(chain.meetsDifficulty(bytes32(type(uint256).max)));
    }

    function test_04b_ZeroDifficultyAcceptsAll() public {
        MiniChain easy = new MiniChain(0);
        assertTrue(easy.meetsDifficulty(bytes32(type(uint256).max)));
    }

    function test_05_RejectsBadNonce() public {
        chain.addTransaction("Ama pays Kofi 5");
        uint256 bad = _findBadNonce(chain, chain.lastHash(), chain.pendingTransactions());
        vm.expectRevert(MiniChain.InvalidNonce.selector);
        chain.mine(bad);
    }

    function test_06_MinesBlock() public {
        chain.addTransaction("Ama pays Kofi 5");
        string[] memory txs = chain.pendingTransactions();
        bytes32 genesisHash = chain.lastHash();
        uint256 n = _findNonce(chain, genesisHash, txs);
        bytes32 h = chain.hashBlock(genesisHash, n, txs);

        vm.expectEmit(true, false, false, true);
        emit BlockMined(1, h);
        chain.mine(n);

        assertEq(chain.blockCount(), 2);
        MiniChain.Block memory b = chain.getBlock(1);
        assertEq(b.hash, h);
        assertEq(b.previousHash, genesisHash);
        assertEq(b.nonce, n);
        assertEq(b.transactions.length, 1);
        assertEq(b.transactions[0], "Ama pays Kofi 5");
        assertEq(chain.pendingTransactions().length, 0);
    }

    function test_06b_MinesEmptyBlock() public {
        _mine(chain);
        assertEq(chain.blockCount(), 2);
        assertEq(chain.getBlock(1).transactions.length, 0);
    }

    function test_07_GetBlockOutOfRange() public {
        vm.expectRevert(abi.encodeWithSelector(MiniChain.NoSuchBlock.selector, 5));
        chain.getBlock(5);
    }

    function test_08_ChainIsValid() public {
        for (uint256 i = 0; i < 3; i++) {
            chain.addTransaction("Ama pays Kofi 5");
            _mine(chain);
        }
        assertEq(chain.blockCount(), 4);
        assertTrue(chain.isValid());
    }

    function test_09_DetectsTampering() public {
        MiniChainHarness h = new MiniChainHarness(8);
        h.addTransaction("Ama pays Kofi 5");
        _mine(h);
        h.addTransaction("Kofi pays Esi 2");
        _mine(h);
        assertTrue(h.isValid());

        h.tamper(1, 0, "Ama pays Kofi 500");
        assertFalse(h.isValid());
    }
}
