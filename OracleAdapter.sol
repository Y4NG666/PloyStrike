// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMarketResolver.sol";

/// @title OracleAdapter (MVP skeleton)
/// @notice Defines oracle wiring and access control; data logic intentionally omitted.
contract OracleAdapter {
    // NOTE: Markets that enter Challenged state must be manually resolved or canceled/refunded by admin in a future C-2 pathway.
    // This contract intentionally defers that logic for the hackathon MVP.
    // ---------------------------------------------------------------------
    // Enums
    // ---------------------------------------------------------------------
    enum ResultStatus {
        None,
        Pending,
        Finalized,
        Challenged,
        Consumed
    }

    // ---------------------------------------------------------------------
    // Structs
    // ---------------------------------------------------------------------
    struct PendingResult {
        uint256 price;
        uint256 timestamp;
        uint256 submittedAt;
        uint256 finalizedAt;
        ResultStatus status;
    }

    // ---------------------------------------------------------------------
    // State Variables
    // ---------------------------------------------------------------------
    address public oracle; // active oracle address
    address public admin; // admin allowed to update oracle
    address public market; // authorized consumer of finalized results
    mapping(bytes32 => PendingResult) public pendingResults;
    uint256 public challengePeriod; // e.g. 2 hours

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event PriceSubmitted(bytes32 indexed marketId, uint256 price, uint256 timestamp);
    event ResultProposed(bytes32 indexed marketId, uint256 price);
    event ResultChallenged(bytes32 indexed marketId, address challenger);
    event ResultFinalized(bytes32 indexed marketId);
    event PriceFinalized(bytes32 indexed marketId, uint256 price, uint256 finalizedAt);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------
    modifier onlyOracle() {
        if (msg.sender != oracle) {
            revert("Not authorized");
        }
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert("Not authorized");
        }
        _;
    }

    modifier onlyMarket() {
        if (msg.sender != market) {
            revert("Not authorized");
        }
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(address _oracle, uint256 _challengePeriod) {
        admin = msg.sender;
        oracle = _oracle;
        require(_challengePeriod > 0, "Invalid challenge period");
        challengePeriod = _challengePeriod;
    }

    // ---------------------------------------------------------------------
    // Admin Management
    // ---------------------------------------------------------------------
    function updateOracle(address newOracle) external onlyAdmin {
        revert("Not implemented");
    }

    function setMarket(address newMarket) external onlyAdmin {
        market = newMarket;
    }

    // ---------------------------------------------------------------------
    // Oracle Entry Point (logic deferred)
    // ---------------------------------------------------------------------
    function submitFinalPrice(
        bytes32 marketId,
        uint256 finalPrice,
        uint256 timestamp
    ) external onlyOracle {
        PendingResult storage result = pendingResults[marketId];
        require(result.status == ResultStatus.None, "Result exists");

        result.price = finalPrice;
        result.timestamp = timestamp;
        result.submittedAt = block.timestamp;
        result.status = ResultStatus.Pending;

        emit ResultProposed(marketId, finalPrice);
    }

    function challengeResult(bytes32 marketId) external payable {
        PendingResult storage result = pendingResults[marketId];
        require(result.status == ResultStatus.Pending, "Not pending");
        require(block.timestamp <= result.submittedAt + challengePeriod, "Challenge window over");
        require(msg.value > 0, "Stake required");

        result.status = ResultStatus.Challenged;

        emit ResultChallenged(marketId, msg.sender);
    }

    function finalizeResult(bytes32 marketId) external {
        PendingResult storage result = pendingResults[marketId];
        require(result.status == ResultStatus.Pending, "Not pending");
        require(block.timestamp > result.submittedAt + challengePeriod, "Challenge period active");

        result.status = ResultStatus.Finalized;
        result.finalizedAt = block.timestamp;

        emit ResultFinalized(marketId);
        emit PriceFinalized(marketId, result.price, result.finalizedAt);
    }

    function consumeFinalResult(bytes32 marketId) external onlyMarket returns (uint256 price) {
        PendingResult storage result = pendingResults[marketId];
        require(result.status == ResultStatus.Finalized, "Not finalized");

        price = result.price;

        result.status = ResultStatus.Consumed;
    }

    function finalizeAndResolve(bytes32 marketId) external onlyOracle {
        PendingResult storage result = pendingResults[marketId];
        require(result.status == ResultStatus.Pending, "Not pending");
        require(block.timestamp > result.submittedAt + challengePeriod, "Challenge period active");
        require(market != address(0), "Market not set");

        result.status = ResultStatus.Finalized;
        result.finalizedAt = block.timestamp;

        emit PriceFinalized(marketId, result.price, result.finalizedAt);

        IMarketResolver(market).resolveMarket(
            uint256(marketId),
            int256(result.price),
            result.finalizedAt
        );
    }
}

    