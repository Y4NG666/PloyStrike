// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Interface for market resolution callbacks.
interface IMarketResolver {
    function resolveMarket(
        uint256 marketId,
        int256 finalPrice,
        uint256 resolvedAt
    ) external;
}

