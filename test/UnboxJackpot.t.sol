// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/UnboxJackpot.sol";

contract UnboxJackpotTest is Test {
    UnboxJackpot private jackpot;

    address private host = address(this);
    address private oracle = address(0xBEEF);
    address private feeVault = address(0xFEE1);
    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    function setUp() public {
        jackpot = new UnboxJackpot("Jackpot", host, oracle, feeVault, 0, 0, 0);
    }

    function testWinnerGetsPayout() public {
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);

        uint256 sessionId = jackpot.createSession();

        vm.prank(alice);
        jackpot.placeBet{value: 1 ether}(sessionId, UnboxJackpot.Option.A);

        vm.prank(bob);
        jackpot.placeBet{value: 1 ether}(sessionId, UnboxJackpot.Option.B);

        vm.prank(oracle);
        jackpot.resolveSession(sessionId, UnboxJackpot.Option.A);

        uint256 before = alice.balance;
        vm.prank(alice);
        jackpot.claimReward(sessionId);
        uint256 afterBal = alice.balance;

        assertGt(afterBal, before, "payout not received");
        assertEq(afterBal - before, 2 ether, "payout amount incorrect");
    }

    function testRefundWhenNoWinner() public {
        vm.deal(alice, 1 ether);

        uint256 sessionId = jackpot.createSession();

        vm.prank(alice);
        jackpot.placeBet{value: 1 ether}(sessionId, UnboxJackpot.Option.A);

        vm.prank(oracle);
        jackpot.resolveSession(sessionId, UnboxJackpot.Option.B); // winner pool zero => refundable

        uint256 before = alice.balance;
        vm.prank(alice);
        jackpot.claimRefund(sessionId);
        uint256 afterBal = alice.balance;

        assertEq(afterBal - before, 1 ether, "refund amount incorrect");
    }

    function testRepeatClaimReverts() public {
        vm.deal(alice, 1 ether);
        uint256 sessionId = jackpot.createSession();

        vm.prank(alice);
        jackpot.placeBet{value: 1 ether}(sessionId, UnboxJackpot.Option.A);

        vm.prank(oracle);
        jackpot.resolveSession(sessionId, UnboxJackpot.Option.A);

        vm.prank(alice);
        jackpot.claimReward(sessionId);

        vm.prank(alice);
        vm.expectRevert(bytes("Already claimed"));
        jackpot.claimReward(sessionId);
    }

    function testResolveOnlyOracle() public {
        uint256 sessionId = jackpot.createSession();

        vm.expectRevert(bytes("Not authorized"));
        jackpot.resolveSession(sessionId, UnboxJackpot.Option.A);
    }
}

