// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Certificates} from "../src/Certificates.sol";

contract CertificatesTest is Test {
    Certificates certs;
    address university = makeAddr("university");
    address ama = makeAddr("ama");
    address kofi = makeAddr("kofi");
    address stranger = makeAddr("stranger");

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Locked(uint256 tokenId);
    event Issued(uint256 indexed id, address indexed student, uint16 year);
    event Revoked(uint256 indexed id);

    function setUp() public {
        vm.prank(university);
        certs = new Certificates();
    }

    function _issue(address student, uint16 year, string memory uri) internal returns (uint256) {
        vm.prank(university);
        return certs.issue(student, year, uri);
    }

    // US1
    function test_US1_OnlyUniversity() public {
        assertEq(certs.university(), university);
        vm.expectRevert(Certificates.NotUniversity.selector);
        vm.prank(stranger);
        certs.issue(ama, 2026, "ipfs://bsc");
    }

    // US2
    function test_US2_Issue() public {
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), ama, 1);
        vm.expectEmit(false, false, false, true);
        emit Locked(1);
        vm.expectEmit(true, true, false, true);
        emit Issued(1, ama, 2026);
        uint256 id = _issue(ama, 2026, "ipfs://bsc-ama");
        assertEq(id, 1);
        assertEq(certs.ownerOf(1), ama);
        assertEq(certs.balanceOf(ama), 1);
        assertEq(certs.tokenURI(1), "ipfs://bsc-ama");
        assertEq(certs.name(), "Ashesi University Certificates");
        assertEq(certs.symbol(), "ASHU");
        assertEq(_issue(kofi, 2027, "ipfs://kofi"), 2);
    }

    function test_US2_ZeroStudent() public {
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721InvalidReceiver.selector, address(0)));
        vm.prank(university);
        certs.issue(address(0), 2026, "ipfs://x");
    }

    function test_US2_InvalidYear() public {
        vm.startPrank(university);
        vm.expectRevert(abi.encodeWithSelector(Certificates.InvalidYear.selector, uint16(2001)));
        certs.issue(ama, 2001, "ipfs://x");
        vm.expectRevert(abi.encodeWithSelector(Certificates.InvalidYear.selector, uint16(2101)));
        certs.issue(ama, 2101, "ipfs://x");
        // the edges of the range are fine
        certs.issue(ama, 2002, "ipfs://first-class");
        certs.issue(ama, 2100, "ipfs://far-future");
        vm.stopPrank();
        assertEq(certs.balanceOf(ama), 2);
    }

    // US3
    function test_US3_Details() public {
        _issue(ama, 2026, "ipfs://bsc-ama");
        assertEq(certs.certificateName(1), "ASH-2026");
        Certificates.Certificate memory c = certs.certificate(1);
        assertEq(c.student, ama);
        assertEq(uint256(c.year), 2026);
        assertEq(c.uri, "ipfs://bsc-ama");
    }

    function test_US3_Nonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 9));
        certs.certificate(9);
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 9));
        certs.certificateName(9);
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 9));
        certs.ownerOf(9);
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 9));
        certs.tokenURI(9);
    }

    // US4
    function test_US4_AllTransfersBlocked() public {
        _issue(ama, 2026, "ipfs://bsc");
        vm.startPrank(ama);
        vm.expectRevert(Certificates.Soulbound.selector);
        certs.transferFrom(ama, kofi, 1);
        vm.expectRevert(Certificates.Soulbound.selector);
        certs.safeTransferFrom(ama, kofi, 1);
        vm.expectRevert(Certificates.Soulbound.selector);
        certs.safeTransferFrom(ama, kofi, 1, "");
        vm.stopPrank();
        // even the university cannot move one
        vm.prank(university);
        vm.expectRevert(Certificates.Soulbound.selector);
        certs.transferFrom(ama, kofi, 1);
        assertEq(certs.ownerOf(1), ama);
    }

    function test_US4_ApprovalsBlocked() public {
        _issue(ama, 2026, "ipfs://bsc");
        vm.startPrank(ama);
        vm.expectRevert(Certificates.Soulbound.selector);
        certs.approve(kofi, 1);
        vm.expectRevert(Certificates.Soulbound.selector);
        certs.setApprovalForAll(kofi, true);
        vm.stopPrank();
        assertEq(certs.getApproved(1), address(0));
        assertFalse(certs.isApprovedForAll(ama, kofi));
    }

    function test_US4_LockedTrue() public {
        _issue(ama, 2026, "ipfs://bsc");
        assertTrue(certs.locked(1));
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 2));
        certs.locked(2);
    }

    // US5
    function test_US5_Multiple() public {
        _issue(ama, 2026, "ipfs://bsc");
        _issue(kofi, 2026, "ipfs://kofi");
        _issue(ama, 2028, "ipfs://msc");
        uint256[] memory list = certs.certificatesOf(ama);
        assertEq(list.length, 2);
        assertEq(list[0], 1);
        assertEq(list[1], 3);
        assertEq(certs.balanceOf(ama), 2);
        assertEq(certs.certificatesOf(kofi).length, 1);
        assertEq(certs.certificatesOf(stranger).length, 0);
        assertEq(certs.certificateName(3), "ASH-2028");
    }

    // US6
    function test_US6_Revoke() public {
        _issue(ama, 2026, "ipfs://bsc");
        vm.expectEmit(true, true, true, true);
        emit Transfer(ama, address(0), 1);
        vm.expectEmit(true, false, false, true);
        emit Revoked(1);
        vm.prank(university);
        certs.revoke(1);
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 1));
        certs.ownerOf(1);
        assertEq(certs.balanceOf(ama), 0);
    }

    function test_US6_RevokeRemovesFromList() public {
        _issue(ama, 2026, "ipfs://bsc");
        _issue(ama, 2028, "ipfs://msc");
        vm.prank(university);
        certs.revoke(1);
        uint256[] memory list = certs.certificatesOf(ama);
        assertEq(list.length, 1);
        assertEq(list[0], 2);
        // revoking something that is already gone fails
        vm.expectRevert(abi.encodeWithSelector(Certificates.ERC721NonexistentToken.selector, 1));
        vm.prank(university);
        certs.revoke(1);
    }

    function test_US6_OnlyUniversityRevokes() public {
        _issue(ama, 2026, "ipfs://bsc");
        vm.expectRevert(Certificates.NotUniversity.selector);
        vm.prank(ama);
        certs.revoke(1);
        vm.expectRevert(Certificates.NotUniversity.selector);
        vm.prank(stranger);
        certs.revoke(1);
        assertEq(certs.ownerOf(1), ama);
    }

    // US7
    function test_US7_SupportsInterface() public view {
        assertTrue(certs.supportsInterface(0x01ffc9a7)); // ERC-165
        assertTrue(certs.supportsInterface(0x80ac58cd)); // ERC-721
        assertTrue(certs.supportsInterface(0x5b5e139f)); // ERC-721 Metadata
        assertTrue(certs.supportsInterface(0xb45a3c0e)); // ERC-5192
        assertFalse(certs.supportsInterface(0xffffffff));
    }
}
