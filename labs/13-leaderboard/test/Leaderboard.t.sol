// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Leaderboard} from "../src/Leaderboard.sol";

contract LeaderboardTest is Test {
    Leaderboard lb;
    address server = makeAddr("server"); // the game owner
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");
    address yaw = makeAddr("yaw");
    address abena = makeAddr("abena");
    address kojo = makeAddr("kojo");
    address efua = makeAddr("efua");

    uint256 constant FEE = 0.01 ether;

    event GameStarted(address indexed player, string username);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 rank);
    event FeesWithdrawn(uint256 amount);

    function setUp() public {
        vm.prank(server);
        lb = new Leaderboard();
    }

    function _pay(address who, string memory name) internal {
        vm.deal(who, 1 ether);
        vm.prank(who);
        lb.newGame{value: FEE}(name);
    }

    function _score(address who, uint256 score) internal {
        vm.prank(server);
        lb.submitScore(who, score);
    }

    /// Pays and submits in one go.
    function _play(address who, string memory name, uint256 score) internal {
        _pay(who, name);
        _score(who, score);
    }

    // US1
    function test_US1_Init() public view {
        assertEq(lb.gameOwner(), server);
        assertEq(lb.leaderboard().length, 0);
        assertEq(lb.ENTRY_FEE(), 0.01 ether);
        assertEq(lb.MAX_LEADERS(), 5);
    }

    // US2
    function test_US2_NewGame() public {
        vm.deal(ama, 1 ether);
        vm.expectEmit(true, false, false, true);
        emit GameStarted(ama, "ama");
        vm.prank(ama);
        lb.newGame{value: FEE}("ama");
        assertTrue(lb.hasPaid(ama));
        assertEq(lb.usernameOf(ama), "ama");
        assertEq(lb.feesOwed(), FEE);
    }

    function test_US2_WrongFee() public {
        vm.deal(ama, 1 ether);
        vm.startPrank(ama);
        vm.expectRevert(abi.encodeWithSelector(Leaderboard.WrongFee.selector, FEE - 1, FEE));
        lb.newGame{value: FEE - 1}("ama");
        vm.expectRevert(abi.encodeWithSelector(Leaderboard.WrongFee.selector, FEE + 1, FEE));
        lb.newGame{value: FEE + 1}("ama");
        vm.stopPrank();
    }

    function test_US2_BadUsername() public {
        vm.deal(ama, 1 ether);
        vm.startPrank(ama);
        vm.expectRevert(Leaderboard.BadUsername.selector);
        lb.newGame{value: FEE}("");
        vm.expectRevert(Leaderboard.BadUsername.selector);
        lb.newGame{value: FEE}("this username is definitely way too long");
        vm.stopPrank();
    }

    function test_US2_AlreadyPlaying() public {
        _pay(ama, "ama");
        vm.prank(ama);
        vm.expectRevert(Leaderboard.AlreadyPlaying.selector);
        lb.newGame{value: FEE}("ama");
    }

    // US3
    function test_US3_OnlyOwner() public {
        _pay(ama, "ama");
        vm.prank(kofi);
        vm.expectRevert(Leaderboard.NotGameOwner.selector);
        lb.submitScore(ama, 100);
    }

    // US4
    function test_US4_Submit() public {
        _pay(ama, "ama");
        _score(ama, 100);
        assertFalse(lb.hasPaid(ama));
        Leaderboard.Player[] memory top = lb.leaderboard();
        assertEq(top.length, 1);
        assertEq(top[0].username, "ama");
        assertEq(top[0].addr, ama);
        assertEq(top[0].score, 100);
    }

    function test_US4_MustPay() public {
        vm.prank(server);
        vm.expectRevert(Leaderboard.NotPlaying.selector);
        lb.submitScore(ama, 100);

        // after submitting, the paid game is used up
        _play(kofi, "kofi", 50);
        vm.prank(server);
        vm.expectRevert(Leaderboard.NotPlaying.selector);
        lb.submitScore(kofi, 60);
    }

    // US5
    function test_US5_Sorted() public {
        _play(ama, "ama", 30);
        _play(kofi, "kofi", 90);
        _play(esi, "esi", 10);
        _play(yaw, "yaw", 70);
        _play(abena, "abena", 50);
        _play(kojo, "kojo", 80);
        _play(efua, "efua", 20);

        Leaderboard.Player[] memory top = lb.leaderboard();
        assertEq(top.length, 5);
        assertEq(top[0].addr, kofi);
        assertEq(top[1].addr, kojo);
        assertEq(top[2].addr, yaw);
        assertEq(top[3].addr, abena);
        assertEq(top[4].addr, ama);
        assertEq(top[0].score, 90);
        assertEq(top[4].score, 30);
    }

    function test_US5_TieKeepsEarlier() public {
        _play(ama, "ama", 50);
        _play(kofi, "kofi", 50);
        Leaderboard.Player[] memory top = lb.leaderboard();
        assertEq(top[0].addr, ama);
        assertEq(top[1].addr, kofi);
    }

    function test_US5_BestScoreOnly() public {
        _play(ama, "ama", 10);
        _play(kofi, "kofi", 20);
        _play(ama, "ama", 30); // a better score moves ama up, no duplicate row

        Leaderboard.Player[] memory top = lb.leaderboard();
        assertEq(top.length, 2);
        assertEq(top[0].addr, ama);
        assertEq(top[0].score, 30);
        assertEq(top[1].addr, kofi);

        _play(ama, "ama", 5); // a worse score changes nothing
        top = lb.leaderboard();
        assertEq(top.length, 2);
        assertEq(top[0].score, 30);
    }

    function test_US5_LowScoreIgnored() public {
        _play(ama, "ama", 50);
        _play(kofi, "kofi", 40);
        _play(esi, "esi", 30);
        _play(yaw, "yaw", 20);
        _play(abena, "abena", 10);

        _pay(kojo, "kojo");
        vm.expectEmit(true, false, false, true);
        emit ScoreSubmitted(kojo, 5, 0);
        _score(kojo, 5);

        Leaderboard.Player[] memory top = lb.leaderboard();
        assertEq(top.length, 5);
        assertEq(top[4].addr, abena);
        assertEq(top[4].score, 10);
    }

    function test_US5_RankInEvent() public {
        _play(ama, "ama", 50);
        _play(kofi, "kofi", 30);

        _pay(esi, "esi");
        vm.expectEmit(true, false, false, true);
        emit ScoreSubmitted(esi, 40, 2);
        _score(esi, 40);
    }

    // US6
    function test_US6_Withdraw() public {
        _pay(ama, "ama");
        _pay(kofi, "kofi");
        uint256 before = server.balance;

        vm.expectEmit(false, false, false, true);
        emit FeesWithdrawn(2 * FEE);
        vm.prank(server);
        lb.withdrawFees();

        assertEq(server.balance, before + 2 * FEE);
        assertEq(lb.feesOwed(), 0);
        assertEq(address(lb).balance, 0);
    }

    function test_US6_NothingToWithdraw() public {
        vm.prank(server);
        vm.expectRevert(Leaderboard.NothingToWithdraw.selector);
        lb.withdrawFees();

        _pay(ama, "ama");
        vm.prank(ama);
        vm.expectRevert(Leaderboard.NotGameOwner.selector);
        lb.withdrawFees();
    }
}
