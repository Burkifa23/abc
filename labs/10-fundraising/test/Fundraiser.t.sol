// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Fundraiser} from "../src/Fundraiser.sol";

contract FundraiserTest is Test {
    Fundraiser fund;
    address creator = makeAddr("creator");
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address mallory = makeAddr("mallory");

    event Donated(address indexed donor, uint256 amount, uint256 raised);
    event GoalReached(uint256 raised);
    event Refunded(address indexed donor, uint256 amount);
    event DescriptionUpdated(string description);

    function setUp() public {
        vm.prank(creator);
        fund = new Fundraiser(150 ether, 7 days, "Smart contract");
        vm.deal(ama, 1000 ether);
        vm.deal(kofi, 1000 ether);
    }

    function _donate(address who, uint256 amount) internal {
        vm.prank(who);
        fund.donate{value: amount}();
    }

    // US1
    function test_US1_Initial() public view {
        assertEq(fund.creator(), creator);
        assertEq(fund.goal(), 150 ether);
        assertEq(fund.deadline(), block.timestamp + 7 days);
        assertEq(fund.description(), "Smart contract");
        assertEq(uint256(fund.status()), uint256(Fundraiser.Status.Open));
        assertEq(fund.raised(), 0);
    }

    // US2
    function test_US2_UpdateDescription() public {
        vm.expectEmit(false, false, false, true);
        emit DescriptionUpdated("Smart contract to raise funds for my start up.");
        vm.prank(creator);
        fund.updateDescription("Smart contract to raise funds for my start up.");
        assertEq(fund.description(), "Smart contract to raise funds for my start up.");
    }

    function test_US2_OnlyCreator() public {
        vm.prank(mallory);
        vm.expectRevert(Fundraiser.NotCreator.selector);
        fund.updateDescription("hacked");
    }

    // US3
    function test_US3_Donate() public {
        vm.expectEmit(true, false, false, true);
        emit Donated(ama, 10 ether, 10 ether);
        _donate(ama, 10 ether);
        assertEq(fund.contributions(ama), 10 ether);
        assertEq(fund.raised(), 10 ether);
        assertEq(uint256(fund.status()), uint256(Fundraiser.Status.Open));
    }

    function test_US3_Zero() public {
        vm.prank(ama);
        vm.expectRevert(Fundraiser.ZeroDonation.selector);
        fund.donate{value: 0}();
    }

    function test_US3_Overshoot() public {
        _donate(ama, 100 ether);
        _donate(kofi, 100 ether); // 200 raised, goal 150: accepted in full
        assertEq(fund.raised(), 200 ether);
        assertEq(fund.contributions(kofi), 100 ether);
        assertEq(uint256(fund.status()), uint256(Fundraiser.Status.Succeeded));
        assertEq(address(fund).balance, 200 ether);
    }

    function test_US3_AfterDeadline() public {
        vm.warp(block.timestamp + 7 days);
        vm.prank(ama);
        vm.expectRevert(Fundraiser.NotOpen.selector);
        fund.donate{value: 1 ether}();
    }

    // US4
    function test_US4_GoalReached() public {
        _donate(ama, 100 ether);
        vm.expectEmit(false, false, false, true);
        emit GoalReached(150 ether);
        _donate(kofi, 50 ether);
        assertEq(uint256(fund.status()), uint256(Fundraiser.Status.Succeeded));

        // later donations are refused
        vm.prank(ama);
        vm.expectRevert(Fundraiser.NotOpen.selector);
        fund.donate{value: 1 ether}();
    }

    function test_US4_Claim() public {
        _donate(ama, 100 ether);
        _donate(kofi, 50 ether);
        uint256 before = creator.balance;
        vm.prank(creator);
        fund.claim();
        assertEq(creator.balance, before + 150 ether);
        assertEq(address(fund).balance, 0);
    }

    function test_US4_ClaimGuards() public {
        _donate(ama, 10 ether);
        vm.prank(creator);
        vm.expectRevert(Fundraiser.NotSucceeded.selector);
        fund.claim();

        _donate(kofi, 140 ether);
        vm.prank(mallory);
        vm.expectRevert(Fundraiser.NotCreator.selector);
        fund.claim();
    }

    // US5
    function test_US5_Finalize() public {
        _donate(ama, 10 ether);
        vm.warp(block.timestamp + 7 days);
        fund.finalize();
        assertEq(uint256(fund.status()), uint256(Fundraiser.Status.Failed));
    }

    function test_US5_FinalizeTooEarly() public {
        vm.expectRevert(Fundraiser.TooEarly.selector);
        fund.finalize();
    }

    // US6
    function test_US6_Refund() public {
        _donate(ama, 10 ether);
        vm.warp(block.timestamp + 7 days);
        fund.finalize();

        uint256 before = ama.balance;
        vm.expectEmit(true, false, false, true);
        emit Refunded(ama, 10 ether);
        vm.prank(ama);
        fund.refund();
        assertEq(ama.balance, before + 10 ether);
        assertEq(fund.contributions(ama), 0);
    }

    function test_US6_RefundOnce() public {
        _donate(ama, 10 ether);
        _donate(kofi, 5 ether);
        vm.warp(block.timestamp + 7 days);
        fund.finalize();

        vm.startPrank(ama);
        fund.refund();
        vm.expectRevert(Fundraiser.NothingToRefund.selector);
        fund.refund();
        vm.stopPrank();
        assertEq(address(fund).balance, 5 ether); // kofi's money is untouched
    }

    function test_US6_NoRefundWhenSucceeded() public {
        _donate(ama, 150 ether);
        vm.prank(ama);
        vm.expectRevert(Fundraiser.NotFailed.selector);
        fund.refund();
    }

    // US7
    function test_US7_Cancel() public {
        _donate(ama, 10 ether);
        vm.prank(creator);
        fund.cancel();
        assertEq(uint256(fund.status()), uint256(Fundraiser.Status.Failed));

        uint256 before = ama.balance;
        vm.prank(ama);
        fund.refund();
        assertEq(ama.balance, before + 10 ether);
    }

    function test_US7_NoCancelAfterSuccess() public {
        _donate(ama, 150 ether);
        vm.prank(creator);
        vm.expectRevert(Fundraiser.NotOpen.selector);
        fund.cancel();
    }
}
