// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAaveLendingPool
 * @dev Interface for Aave V3 Lending Pool
 * @notice Defines the core functions needed to interact with Aave lending pool
 */
interface IAaveLendingPool {
    /**
     * @notice Supplies an `amount` of underlying asset into the reserve, receiving in return overlying aTokens
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to register the integrator originating the operation
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @notice Withdraws an `amount` of underlying asset from the reserve
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     * @param to The address that will receive the withdrawn assets
     * @return The actual amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /**
     * @notice Returns the underlying balance of the user
     * @param user The address of the user
     * @param asset The address of the asset
     * @return The balance of the underlying asset
     */
    function getBalance(address asset, address user) external view returns (uint256);
}
