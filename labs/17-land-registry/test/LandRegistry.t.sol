// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LandRegistry} from "../src/LandRegistry.sol";
import {ERC721Minimal} from "../src/ERC721Minimal.sol";

contract LandRegistryTest is Test {
    LandRegistry reg;
    address registrar = makeAddr("registrar");
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address esi = makeAddr("esi");
    address agent = makeAddr("agent");

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event PlotRegistered(uint256 indexed id, string region, uint256 plotNumber, address indexed owner);
    event DisputeSet(uint256 indexed id, bool disputed);
    event CourtOrderTransfer(uint256 indexed id, address indexed from, address indexed to);

    function setUp() public {
        vm.prank(registrar);
        reg = new LandRegistry();
    }

    function _register(string memory region, uint256 number, address owner) internal returns (uint256) {
        vm.prank(registrar);
        return reg.register(region, number, 600, owner);
    }

    // US1
    function test_US1_PlotId() public view {
        uint256 id = reg.plotId("Accra", 12);
        assertEq(id, uint256(keccak256(abi.encode("Accra", uint256(12)))));
        assertEq(reg.plotId("Accra", 12), id); // deterministic
        assertTrue(reg.plotId("Accra", 13) != id);
        assertTrue(reg.plotId("Kumasi", 12) != id);
    }

    function test_US1_NoEncodingCollision() public {
        // With abi.encodePacked the region and the number could blur into each other.
        assertTrue(reg.plotId("Accra", 12) != reg.plotId("Accra1", 2));
        uint256 a = _register("Accra", 12, ama);
        uint256 b = _register("Accra1", 2, kofi);
        assertTrue(a != b);
        assertEq(reg.ownerOf(a), ama);
        assertEq(reg.ownerOf(b), kofi);
    }

    // US2
    function test_US2_Register() public {
        uint256 id = reg.plotId("Accra", 12);
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), ama, id);
        vm.expectEmit(true, true, false, true);
        emit PlotRegistered(id, "Accra", 12, ama);
        vm.prank(registrar);
        uint256 got = reg.register("Accra", 12, 450, ama);
        assertEq(got, id);
        assertEq(reg.ownerOf(id), ama);
        assertEq(reg.registrar(), registrar);
        LandRegistry.Plot memory p = reg.plot(id);
        assertEq(p.region, "Accra");
        assertEq(p.plotNumber, 12);
        assertEq(p.areaSqm, 450);
        assertFalse(p.disputed);
    }

    function test_US2_OnlyRegistrar() public {
        vm.expectRevert(LandRegistry.NotRegistrar.selector);
        vm.prank(ama);
        reg.register("Accra", 12, 450, ama);
    }

    function test_US2_NoDoubleTitle() public {
        uint256 id = _register("Accra", 12, ama);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.AlreadyRegistered.selector, id));
        vm.prank(registrar);
        reg.register("Accra", 12, 450, kofi); // the corrupt clerk's second title
        assertEq(reg.ownerOf(id), ama);
    }

    function test_US2_ZeroArea() public {
        vm.expectRevert(LandRegistry.ZeroArea.selector);
        vm.prank(registrar);
        reg.register("Accra", 12, 0, ama);
    }

    // US3
    function test_US3_OwnerTransfers() public {
        uint256 id = _register("Accra", 12, ama);
        vm.prank(ama);
        reg.transferFrom(ama, kofi, id);
        assertEq(reg.ownerOf(id), kofi);
        assertEq(reg.balanceOf(ama), 0);
        assertEq(reg.balanceOf(kofi), 1);
    }

    function test_US3_StrangerCannot() public {
        uint256 id = _register("Accra", 12, ama);
        vm.expectRevert(ERC721Minimal.NotAuthorized.selector);
        vm.prank(esi);
        reg.transferFrom(ama, esi, id);
        // not even the registrar can take a title with an ordinary transfer
        vm.expectRevert(ERC721Minimal.NotAuthorized.selector);
        vm.prank(registrar);
        reg.transferFrom(ama, registrar, id);
    }

    // US4
    function test_US4_FreezeBlocksTransfer() public {
        uint256 id = _register("Accra", 12, ama);
        vm.expectEmit(true, false, false, true);
        emit DisputeSet(id, true);
        vm.prank(registrar);
        reg.setDisputed(id, true);
        assertTrue(reg.plot(id).disputed);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.Disputed.selector, id));
        vm.prank(ama);
        reg.transferFrom(ama, kofi, id);
        assertEq(reg.ownerOf(id), ama);
    }

    function test_US4_DisputedBlocksOperator() public {
        uint256 id = _register("Accra", 12, ama);
        vm.startPrank(ama);
        reg.approve(kofi, id);
        reg.setApprovalForAll(agent, true);
        vm.stopPrank();
        vm.prank(registrar);
        reg.setDisputed(id, true);

        vm.expectRevert(abi.encodeWithSelector(LandRegistry.Disputed.selector, id));
        vm.prank(kofi); // approved for this title
        reg.transferFrom(ama, kofi, id);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.Disputed.selector, id));
        vm.prank(agent); // approved for all
        reg.transferFrom(ama, agent, id);
        vm.expectRevert(abi.encodeWithSelector(LandRegistry.Disputed.selector, id));
        vm.prank(ama);
        reg.safeTransferFrom(ama, esi, id);
    }

    function test_US4_Unfreeze() public {
        uint256 id = _register("Accra", 12, ama);
        vm.startPrank(registrar);
        reg.setDisputed(id, true);
        reg.setDisputed(id, false);
        vm.stopPrank();
        vm.prank(ama);
        reg.transferFrom(ama, kofi, id);
        assertEq(reg.ownerOf(id), kofi);
    }

    function test_US4_OnlyRegistrarFreezes() public {
        uint256 id = _register("Accra", 12, ama);
        vm.expectRevert(LandRegistry.NotRegistrar.selector);
        vm.prank(ama);
        reg.setDisputed(id, true);
    }

    // US5
    function test_US5_History() public {
        uint256 id = _register("Accra", 12, ama);
        vm.prank(ama);
        reg.transferFrom(ama, kofi, id);
        vm.prank(kofi);
        reg.transferFrom(kofi, esi, id);
        vm.prank(esi);
        reg.transferFrom(esi, ama, id); // back to the first owner: still listed again
        address[] memory h = reg.ownershipHistory(id);
        assertEq(h.length, 4);
        assertEq(h[0], ama);
        assertEq(h[1], kofi);
        assertEq(h[2], esi);
        assertEq(h[3], ama);
    }

    // US6
    function test_US6_CourtOrderReassign() public {
        uint256 id = _register("Accra", 12, ama);
        vm.prank(registrar);
        reg.setDisputed(id, true);
        vm.expectEmit(true, true, true, true);
        emit CourtOrderTransfer(id, ama, kofi);
        vm.prank(registrar);
        reg.courtOrderTransfer(id, kofi);
        assertEq(reg.ownerOf(id), kofi);
        assertFalse(reg.plot(id).disputed); // the dispute is resolved
        address[] memory h = reg.ownershipHistory(id);
        assertEq(h.length, 2);
        assertEq(h[1], kofi);
        // ordinary rules apply again afterwards
        vm.prank(kofi);
        reg.transferFrom(kofi, esi, id);
        assertEq(reg.ownerOf(id), esi);
    }

    function test_US6_OnlyRegistrarCourtOrder() public {
        uint256 id = _register("Accra", 12, ama);
        vm.expectRevert(LandRegistry.NotRegistrar.selector);
        vm.prank(ama);
        reg.courtOrderTransfer(id, ama);
        vm.expectRevert(LandRegistry.NotRegistrar.selector);
        vm.prank(kofi);
        reg.courtOrderTransfer(id, kofi);
    }

    // US7
    function test_US7_UnknownPlot() public {
        uint256 id = reg.plotId("Nowhere", 1);
        bytes memory err = abi.encodeWithSelector(LandRegistry.UnknownPlot.selector, id);
        vm.expectRevert(err);
        reg.plot(id);
        vm.expectRevert(err);
        reg.ownershipHistory(id);
        vm.startPrank(registrar);
        vm.expectRevert(err);
        reg.setDisputed(id, true);
        vm.expectRevert(err);
        reg.courtOrderTransfer(id, kofi);
        vm.stopPrank();
    }
}
