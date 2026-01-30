// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title UnboxJackpot (skeleton)
/// @notice Live unbox jackpot demo using native ETH; logic to be implemented later.
contract UnboxJackpot is ReentrancyGuard {
    // ---------------------------------------------------------------------
    // Enums
    // ---------------------------------------------------------------------
    enum JackpotState {
        Open,
        Locked,
        Resolved,
        Cancelled
    }

    enum Option {
        A,
        B,
        C
    }

    // ---------------------------------------------------------------------
    // Structs
    // ---------------------------------------------------------------------
    struct Entry {
        uint256 amount;
        uint256 enteredAt;
    }

    struct SessionPools {
        uint256[3] optionPools; // index by Option
        uint256 totalPool;
        JackpotState state;
        uint256 resolveTimestamp;
        uint256 winningOption; // castable from Option
        uint256 feeRate; // basis points for this session
        uint256 bettingEndTime;
    }

    struct UserSessionBets {
        uint256[3] amounts; // index by Option
        bool claimedReward;
        bool claimedRefund;
    }

    // ---------------------------------------------------------------------
    // Core State
    // ---------------------------------------------------------------------
    string public name;
    uint256 public entryDeadline;
    uint256 public resolveDeadline;
    uint256 public feeRate; // default basis points

    address public host;
    address public oracle;
    address public feeVault;

    JackpotState public state;
    uint256 public currentSessionId;

    // sessionId => pools/state
    mapping(uint256 => SessionPools) public sessions;

    // sessionId => user => bets/claim flags
    mapping(uint256 => mapping(address => UserSessionBets)) internal userSessions;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event Entered(uint256 indexed sessionId, address indexed user, Option option, uint256 amount);
    event SessionCreated(uint256 indexed sessionId, uint256 bettingEndTime, uint256 feeRate);
    event SessionOpened(uint256 indexed sessionId, uint256 entryDeadline, uint256 resolveDeadline, uint256 feeRate);
    event SessionLocked(uint256 indexed sessionId);
    event JackpotResolved(uint256 indexed sessionId, Option winningOption, uint256 pool);
    event JackpotRefundable(uint256 indexed sessionId);
    event RewardClaimed(uint256 indexed sessionId, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed sessionId, address indexed user, uint256 amount);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------
    modifier onlyOracle() {
        if (msg.sender != oracle) {
            revert("Not authorized");
        }
        _;
    }

    modifier onlyHost() {
        if (msg.sender != host) {
            revert("Not authorized");
        }
        _;
    }

    modifier onlyResolver() {
        if (msg.sender != oracle) {
            revert("Not authorized");
        }
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(
        string memory _name,
        address _host,
        address _oracle,
        address _feeVault,
        uint256 _entryDeadline,
        uint256 _resolveDeadline,
        uint256 _feeRate
    ) {
        name = _name;
        host = _host;
        oracle = _oracle;
        feeVault = _feeVault;
        entryDeadline = _entryDeadline;
        resolveDeadline = _resolveDeadline;
        feeRate = _feeRate;
        state = JackpotState.Open;
    }

    // ---------------------------------------------------------------------
    // Public API (logic pending)
    // ---------------------------------------------------------------------
    function enter() external payable nonReentrant {
        revert("Not implemented");
    }

    function resolve(uint256 winningTicket) external onlyOracle {
        revert("Not implemented");
    }

    function claimReward() external nonReentrant {
        revert("Not implemented");
    }

    function resolveSession(uint256 sessionId, Option result) external onlyResolver {
        SessionPools storage s = sessions[sessionId];
        require(s.state == JackpotState.Open, "Not open");

        s.winningOption = uint256(result);
        s.resolveTimestamp = block.timestamp;

        uint256 winnerPool = s.optionPools[uint256(result)];
        if (winnerPool == 0) {
            s.state = JackpotState.Cancelled;
            emit JackpotRefundable(sessionId);
        } else {
            s.state = JackpotState.Resolved;
            emit JackpotResolved(sessionId, result, s.totalPool);
        }
    }

    function placeBet(uint256 sessionId, Option prediction) external payable nonReentrant {
        require(msg.value > 0, "Zero stake");

        SessionPools storage s = sessions[sessionId];
        require(s.state == JackpotState.Open, "Not betting");
        require(block.timestamp <= s.bettingEndTime, "Betting closed");

        s.totalPool += msg.value;
        uint256 optionIndex = uint256(prediction);
        s.optionPools[optionIndex] += msg.value;

        UserSessionBets storage ub = userSessions[sessionId][msg.sender];
        ub.amounts[optionIndex] += msg.value;

        emit Entered(sessionId, msg.sender, prediction, msg.value);
    }

    function claimReward(uint256 sessionId) external nonReentrant {
        SessionPools storage s = sessions[sessionId];
        require(s.state == JackpotState.Resolved, "Not resolved");

        UserSessionBets storage ub = userSessions[sessionId][msg.sender];
        require(!ub.claimedReward, "Already claimed");

        uint256 winnerPool = s.optionPools[s.winningOption];
        uint256 userBet = ub.amounts[s.winningOption];
        require(userBet > 0, "No winning bet");
        require(winnerPool > 0, "Invalid winner pool");

        uint256 reward = (userBet * s.totalPool) / winnerPool;

        ub.claimedReward = true;

        (bool ok, ) = payable(msg.sender).call{value: reward}("");
        require(ok, "Transfer failed");

        emit RewardClaimed(sessionId, msg.sender, reward);
    }

    function claimRefund(uint256 sessionId) external nonReentrant {
        SessionPools storage s = sessions[sessionId];
        require(s.state == JackpotState.Cancelled, "Not refundable");

        UserSessionBets storage ub = userSessions[sessionId][msg.sender];
        require(!ub.claimedRefund, "Already refunded");

        uint256 refundAmount;
        for (uint256 i = 0; i < 3; i++) {
            uint256 amt = ub.amounts[i];
            if (amt > 0) {
                refundAmount += amt;
                ub.amounts[i] = 0;
            }
        }
        require(refundAmount > 0, "No bets");

        ub.claimedRefund = true;

        (bool ok, ) = payable(msg.sender).call{value: refundAmount}("");
        require(ok, "Transfer failed");

        emit RefundClaimed(sessionId, msg.sender, refundAmount);
    }

    function createSession() external onlyHost returns (uint256 sessionId) {
        if (currentSessionId != 0) {
            JackpotState prev = sessions[currentSessionId].state;
            require(
                prev == JackpotState.Resolved || prev == JackpotState.Cancelled,
                "Previous session not ended"
            );
        }

        sessionId = ++currentSessionId;
        SessionPools storage s = sessions[sessionId];
        s.state = JackpotState.Open; // BETTING
        s.feeRate = feeRate;
        s.bettingEndTime = block.timestamp + 60;

        emit SessionCreated(sessionId, s.bettingEndTime, s.feeRate);
    }
}

