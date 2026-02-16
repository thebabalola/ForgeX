# ForgeX Issues & Roadmap

## 🚀 Chainlink Integration

### Issue #1: Price Feeds Integration
**Status:** ✅ COMPLETED
**Description:** Integrate Chainlink Price Feeds to get real-time USD valuation of vault assets.
- **Tasks:**
  - [x] Add `AggregatorV3Interface`.
  - [x] Update `UserVault` to store price feed address.
  - [x] Implement `getAssetPrice()` function.
  - [x] Implement `getTotalValueUSD()` function.

### Issue #2: Automation Integration
**Status:** ✅ COMPLETED
**Description:** Use Chainlink Automation for rebalancing.
- **Tasks:**
  - [x] Implement `checkUpkeep` and `performUpkeep`.
  - [x] Register with Chainlink Automation.

## 🛠️ Core Features

### Issue #3: Multi-Vault Dashboard
**Status:** ✅ COMPLETED
**Description:** Frontend interface for managing multiple vaults.
