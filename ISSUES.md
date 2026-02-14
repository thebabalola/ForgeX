# ForgeX Issues & Roadmap

## 🚀 Chainlink Integration

### Issue #1: Price Feeds Integration
**Status:** ❌ PENDING
**Description:** Integrate Chainlink Price Feeds to get real-time USD valuation of vault assets.
- **Tasks:**
  - [ ] Add `AggregatorV3Interface`.
  - [ ] Update `UserVault` to store price feed address.
  - [ ] Implement `getAssetPrice()` function.
  - [ ] Implement `getTotalValueUSD()` function.

### Issue #2: Automation Integration
**Status:** ❌ PENDING
**Description:** Use Chainlink Automation for rebalancing.
- **Tasks:**
  - [ ] Implement `checkUpkeep` and `performUpkeep`.
  - [ ] Register with Chainlink Automation.

## 🛠️ Core Features

### Issue #3: Multi-Vault Dashboard
**Status:** ✅ COMPLETED
**Description:** Frontend interface for managing multiple vaults.
