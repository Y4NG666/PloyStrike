// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PredictionMarket (MVP skeleton)
/// @notice Structure definitions for a simple yes/no prediction market.
contract PredictionMarket {
    // ---------------------------------------------------------------------
    // Enums
    // ---------------------------------------------------------------------
    enum MarketState {
        Open,
        Locked,
        Resolved,
        Cancelled
    }

    enum Side {
        Yes,
        No
    }

    // ---------------------------------------------------------------------
    // Structs
    // ---------------------------------------------------------------------
    struct Bet {
        uint256 yesAmount;
        uint256 noAmount;
    }

    // ---------------------------------------------------------------------
    // Core State Variables
    // ---------------------------------------------------------------------
    string public description;
    string public skinId;
    uint256 public strikePrice;
    uint256 public expiryTimestamp;
    uint256 public resolutionTimestamp;
    uint256 public feeRate; // basis points (1% = 100)
    address public feeVault;

    MarketState public state;
    Side public winningSide;

    uint256 public totalYesPool;
    uint256 public totalNoPool;

    address public oracle;

    mapping(address => Bet) internal userBets;
    mapping(address => bool) public hasClaimed;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event BetPlaced(address indexed user, Side side, uint256 amount);
    event MarketResolved(Side winningSide, uint256 price);
    event RewardClaimed(address indexed user, uint256 amount);

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(
        string memory _description,
        string memory _skinId,
        uint256 _strikePrice,
        uint256 _expiryTimestamp,
        uint256 _resolutionTimestamp,
        address _oracle,
        uint256 _feeRate,
        address _feeVault
    ) {
        description = _description;
        skinId = _skinId;
        strikePrice = _strikePrice;
        expiryTimestamp = _expiryTimestamp;
        resolutionTimestamp = _resolutionTimestamp;
        oracle = _oracle;
        require(_feeRate <= 10_000, "Invalid fee");
        feeRate = _feeRate;
        require(_feeVault != address(0), "Invalid fee vault");
        feeVault = _feeVault;
        state = MarketState.Open;
    }

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------
    modifier onlyOracle() {
        if (msg.sender != oracle) {
            revert("Not authorized");
        }
        _;
    }

    // ---------------------------------------------------------------------
    // Reserved Functions (logic to be implemented later)
    // ---------------------------------------------------------------------
    function betYes() external payable {
        require(msg.value > 0, "Zero stake");
        require(state == MarketState.Open, "Market not open");
        require(block.timestamp < expiryTimestamp, "Expired");

        // effects
        totalYesPool += msg.value;
        userBets[msg.sender].yesAmount += msg.value;

        emit BetPlaced(msg.sender, Side.Yes, msg.value);
    }

    function betNo() external payable {
        require(msg.value > 0, "Zero stake");
        require(state == MarketState.Open, "Market not open");
        require(block.timestamp < expiryTimestamp, "Expired");

        // effects
        totalNoPool += msg.value;
        userBets[msg.sender].noAmount += msg.value;

        emit BetPlaced(msg.sender, Side.No, msg.value);
    }

    /// @notice Called by oracle adapter after external finalization; assumes data is finalized upstream.
    function resolveMarket(uint256 finalPrice) external onlyOracle {
        require(state == MarketState.Open, "Not open");
        require(block.timestamp >= expiryTimestamp, "Not expired");
        require(totalYesPool > 0 && totalNoPool > 0, "Invalid market: empty side");

        if (finalPrice >= strikePrice) {
            winningSide = Side.Yes;
        } else {
            winningSide = Side.No;
        }

        state = MarketState.Resolved;
        resolutionTimestamp = block.timestamp;

        emit MarketResolved(winningSide, finalPrice);
    }

    function claimReward() external {
        require(state == MarketState.Resolved, "Not resolved");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 userYes = userBets[msg.sender].yesAmount;
        uint256 userNo = userBets[msg.sender].noAmount;

        uint256 userBet = winningSide == Side.Yes ? userYes : userNo;
        require(userBet > 0, "No winning bet");

        uint256 winnerPool = winningSide == Side.Yes ? totalYesPool : totalNoPool;
        uint256 loserPool = winningSide == Side.Yes ? totalNoPool : totalYesPool;
        require(winnerPool > 0 && loserPool >= 0, "Invalid pool");

        uint256 payout = userBet + (userBet * loserPool) / winnerPool;
        uint256 fee = (payout * feeRate) / 10_000;
        uint256 finalAmount = payout - fee;
        require(address(this).balance >= finalAmount + fee, "Insufficient balance");

        hasClaimed[msg.sender] = true;

        (bool success, ) = payable(msg.sender).call{value: finalAmount}("");
        require(success, "Transfer failed");

        if (fee > 0) {
            (bool feeOk, ) = payable(feeVault).call{value: fee}("");
            require(feeOk, "Fee transfer failed");
        }

        emit RewardClaimed(msg.sender, finalAmount);
    }
}

