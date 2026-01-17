import { expect } from "chai";
import { ethers } from "hardhat";
import {
  UserVault,
  MockERC20,
  ChainlinkMock,
  MockAaveLendingPool,
  VaultFactory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UserVault - Aave Integration", function () {
  let vault: UserVault;
  let asset: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let priceFeed: ChainlinkMock;
  let mockAaveLendingPool: MockAaveLendingPool;
  let vaultFactory: VaultFactory;

  const INITIAL_MINT = ethers.parseEther("10000");
  const depositAmount = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);
    await asset.waitForDeployment();

    // Mint tokens to users
    await asset.mint(user1.address, INITIAL_MINT);
    await asset.mint(user2.address, INITIAL_MINT);

    // Deploy ChainlinkMock (2000 USDC/USD, 8 decimals)
    const ChainlinkMockFactory =
      await ethers.getContractFactory("ChainlinkMock");
    priceFeed = await ChainlinkMockFactory.deploy(200000000000, 8); // $2000
    await priceFeed.waitForDeployment();

    // Deploy mock Aave Lending Pool
    const MockAaveLendingPoolFactory = await ethers.getContractFactory(
      "MockAaveLendingPool",
    );
    mockAaveLendingPool = await MockAaveLendingPoolFactory.deploy();
    await mockAaveLendingPool.waitForDeployment();

    // Deploy VaultFactory
    const VaultFactoryContract =
      await ethers.getContractFactory("VaultFactory");
    vaultFactory = await VaultFactoryContract.deploy(owner.address);
    await vaultFactory.waitForDeployment();

    // Set Aave address in factory
    await vaultFactory
      .connect(owner)
      .setAaveAddress(await mockAaveLendingPool.getAddress());

    // Create vault via factory
    await vaultFactory.connect(user1).registerUser("testuser", "test bio");
    await vaultFactory.connect(user1).createVault(await asset.getAddress());

    // Extract vault address from event
    const vaultAddress = await vaultFactory.getUserVaults(user1.address);
    vault = await ethers.getContractAt("UserVault", vaultAddress[0]);

    // Deposit initial assets into vault
    await asset.connect(user1).approve(await vault.getAddress(), depositAmount);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    // Approve assets to Aave for vault
    await asset
      .connect(owner)
      .approve(
        await mockAaveLendingPool.getAddress(),
        ethers.parseEther("100000"),
      );
  });

  describe("Aave Deployment", function () {
    it("Should deploy assets to Aave", async function () {
      const deployAmount = ethers.parseEther("500");
      const balanceBefore = await asset.balanceOf(await vault.getAddress());

      await expect(vault.connect(user1).deployToAave(deployAmount))
        .to.emit(vault, "ProtocolDeployed")
        .withArgs("Aave", deployAmount);

      // Check balance decreased
      const balanceAfter = await asset.balanceOf(await vault.getAddress());
      expect(balanceAfter).to.equal(balanceBefore - deployAmount);
    });

    it("Should track Aave deposits correctly", async function () {
      const deployAmount = ethers.parseEther("300");

      await vault.connect(user1).deployToAave(deployAmount);
      const aaveBalance = await vault.getAaveBalance();

      expect(aaveBalance).to.equal(deployAmount);
    });

    it("Should allow multiple deployments to Aave", async function () {
      const deployAmount1 = ethers.parseEther("200");
      const deployAmount2 = ethers.parseEther("300");

      await vault.connect(user1).deployToAave(deployAmount1);
      let aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(deployAmount1);

      await vault.connect(user1).deployToAave(deployAmount2);
      aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(deployAmount1 + deployAmount2);
    });

    it("Should revert deployment with zero amount", async function () {
      await expect(
        vault.connect(user1).deployToAave(0),
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("Should revert deployment when Aave address not set", async function () {
      // Create new vault without Aave address
      await vaultFactory.connect(user2).registerUser("user2", "user2 bio");
      const tx = await vaultFactory
        .connect(user2)
        .createVault(await asset.getAddress());
      await tx.wait();

      const vaults = await vaultFactory.getUserVaults(user2.address);
      const newVault = await ethers.getContractAt("UserVault", vaults[0]);

      // Remove Aave address
      await vaultFactory.connect(owner).setAaveAddress(ethers.ZeroAddress);

      const deployAmount = ethers.parseEther("100");
      await expect(
        newVault.connect(user2).deployToAave(deployAmount),
      ).to.be.revertedWithCustomError(vault, "ProtocolAddressNotSet");
    });

    it("Should revert deployment with insufficient balance", async function () {
      const deployAmount = ethers.parseEther("5000"); // More than deposited

      await expect(
        vault.connect(user1).deployToAave(deployAmount),
      ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("Should revert deployment if not owner", async function () {
      const deployAmount = ethers.parseEther("100");

      await expect(vault.connect(user2).deployToAave(deployAmount)).to.be
        .reverted; // Should fail ownership check
    });

    it("Should revert deployment when vault is paused", async function () {
      const deployAmount = ethers.parseEther("100");

      await vault.connect(user1).pause();

      await expect(
        vault.connect(user1).deployToAave(deployAmount),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });

  describe("Aave Withdrawal", function () {
    const deployAmount = ethers.parseEther("500");

    beforeEach(async function () {
      // Deploy some assets to Aave first
      await vault.connect(user1).deployToAave(deployAmount);
    });

    it("Should withdraw assets from Aave", async function () {
      const withdrawAmount = ethers.parseEther("200");
      const balanceBefore = await asset.balanceOf(await vault.getAddress());

      await expect(vault.connect(user1).withdrawFromAave(withdrawAmount))
        .to.emit(vault, "ProtocolWithdrawn")
        .withArgs("Aave", withdrawAmount);

      // Check balance increased
      const balanceAfter = await asset.balanceOf(await vault.getAddress());
      expect(balanceAfter).to.equal(balanceBefore + withdrawAmount);
    });

    it("Should update Aave balance after withdrawal", async function () {
      const withdrawAmount = ethers.parseEther("200");

      await vault.connect(user1).withdrawFromAave(withdrawAmount);
      const aaveBalance = await vault.getAaveBalance();

      expect(aaveBalance).to.equal(deployAmount - withdrawAmount);
    });

    it("Should allow full withdrawal from Aave", async function () {
      await vault.connect(user1).withdrawFromAave(deployAmount);
      const aaveBalance = await vault.getAaveBalance();

      expect(aaveBalance).to.equal(0);
    });

    it("Should allow partial withdrawals multiple times", async function () {
      const withdrawAmount1 = ethers.parseEther("100");
      const withdrawAmount2 = ethers.parseEther("150");

      await vault.connect(user1).withdrawFromAave(withdrawAmount1);
      let aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(deployAmount - withdrawAmount1);

      await vault.connect(user1).withdrawFromAave(withdrawAmount2);
      aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(
        deployAmount - withdrawAmount1 - withdrawAmount2,
      );
    });

    it("Should revert withdrawal with zero amount", async function () {
      await expect(
        vault.connect(user1).withdrawFromAave(0),
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("Should revert withdrawal when Aave address not set", async function () {
      // Remove Aave address
      await vaultFactory.connect(owner).setAaveAddress(ethers.ZeroAddress);

      const withdrawAmount = ethers.parseEther("100");
      await expect(
        vault.connect(user1).withdrawFromAave(withdrawAmount),
      ).to.be.revertedWithCustomError(vault, "ProtocolAddressNotSet");
    });

    it("Should revert withdrawal with insufficient Aave balance", async function () {
      const withdrawAmount = ethers.parseEther("1000"); // More than deployed

      await expect(
        vault.connect(user1).withdrawFromAave(withdrawAmount),
      ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("Should revert withdrawal if not owner", async function () {
      const withdrawAmount = ethers.parseEther("100");

      await expect(vault.connect(user2).withdrawFromAave(withdrawAmount)).to.be
        .reverted; // Should fail ownership check
    });

    it("Should revert withdrawal when vault is paused", async function () {
      const withdrawAmount = ethers.parseEther("100");

      await vault.connect(user1).pause();

      await expect(
        vault.connect(user1).withdrawFromAave(withdrawAmount),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });

  describe("Aave Balance Tracking", function () {
    it("Should return zero balance initially", async function () {
      const aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(0);
    });

    it("Should return correct balance after deployment", async function () {
      const deployAmount = ethers.parseEther("350");

      await vault.connect(user1).deployToAave(deployAmount);
      const aaveBalance = await vault.getAaveBalance();

      expect(aaveBalance).to.equal(deployAmount);
    });

    it("Should return correct balance after withdrawal", async function () {
      const deployAmount = ethers.parseEther("500");
      const withdrawAmount = ethers.parseEther("200");

      await vault.connect(user1).deployToAave(deployAmount);
      await vault.connect(user1).withdrawFromAave(withdrawAmount);

      const aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(deployAmount - withdrawAmount);
    });

    it("Should be a view function (no state changes)", async function () {
      const deployAmount = ethers.parseEther("400");
      await vault.connect(user1).deployToAave(deployAmount);

      // Call getAaveBalance multiple times - should return same value
      const balance1 = await vault.getAaveBalance();
      const balance2 = await vault.getAaveBalance();

      expect(balance1).to.equal(balance2);
      expect(balance1).to.equal(deployAmount);
    });

    it("Should accumulate balance correctly", async function () {
      const deployAmount1 = ethers.parseEther("200");
      const deployAmount2 = ethers.parseEther("300");

      await vault.connect(user1).deployToAave(deployAmount1);
      let balance = await vault.getAaveBalance();
      expect(balance).to.equal(deployAmount1);

      await vault.connect(user1).deployToAave(deployAmount2);
      balance = await vault.getAaveBalance();
      expect(balance).to.equal(deployAmount1 + deployAmount2);
    });
  });

  describe("Aave Integration Edge Cases", function () {
    it("Should handle deployment to Aave before any user deposits", async function () {
      // Create new vault
      await vaultFactory.connect(user2).registerUser("user2", "bio");
      const tx = await vaultFactory
        .connect(user2)
        .createVault(await asset.getAddress());
      await tx.wait();

      const vaults = await vaultFactory.getUserVaults(user2.address);
      const newVault = await ethers.getContractAt("UserVault", vaults[0]);

      // Try to deploy to Aave (should fail - no balance)
      await expect(
        newVault.connect(user2).deployToAave(ethers.parseEther("100")),
      ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("Should allow deployment and withdrawal in sequence", async function () {
      const amount = ethers.parseEther("300");

      // Deploy to Aave
      await vault.connect(user1).deployToAave(amount);
      let aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(amount);

      // Withdraw from Aave
      await vault.connect(user1).withdrawFromAave(amount);
      aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(0);

      // Verify assets are back in vault
      const vaultBalance = await asset.balanceOf(await vault.getAddress());
      expect(vaultBalance).to.be.gt(0);
    });

    it("Should maintain vault state during Aave operations", async function () {
      const deployAmount = ethers.parseEther("400");

      const userSharesBefore = await vault.balanceOf(user1.address);
      const totalAssetsBefore = await vault.totalAssets();

      // Deploy to Aave
      await vault.connect(user1).deployToAave(deployAmount);

      // Shares and total assets should remain the same
      const userSharesAfter = await vault.balanceOf(user1.address);
      const totalAssetsAfter = await vault.totalAssets();

      expect(userSharesAfter).to.equal(userSharesBefore);
      expect(totalAssetsAfter).to.equal(totalAssetsBefore);
    });

    it("Should support concurrent Aave deployments and withdrawals", async function () {
      // First deployment
      await vault.connect(user1).deployToAave(ethers.parseEther("200"));
      let aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(ethers.parseEther("200"));

      // Second deployment
      await vault.connect(user1).deployToAave(ethers.parseEther("300"));
      aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(ethers.parseEther("500"));

      // Withdrawal
      await vault.connect(user1).withdrawFromAave(ethers.parseEther("150"));
      aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(ethers.parseEther("350"));
    });
  });

  describe("Aave Integration with Protocol Allocation", function () {
    it("Should work with protocol allocation tracking", async function () {
      const deployAmount = ethers.parseEther("300");

      // Set Aave allocation
      await vault.connect(user1).setProtocolAllocation("Aave", deployAmount);
      const allocation = await vault.getProtocolAllocation("Aave");
      expect(allocation).to.equal(deployAmount);

      // Deploy to Aave
      await vault.connect(user1).deployToAave(deployAmount);
      const aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(deployAmount);
    });

    it("Should handle allocation adjustments with Aave deployments", async function () {
      const initialAllocation = ethers.parseEther("200");
      const newAllocation = ethers.parseEther("400");

      // Set and deploy initial allocation
      await vault
        .connect(user1)
        .setProtocolAllocation("Aave", initialAllocation);
      await vault.connect(user1).deployToAave(initialAllocation);

      // Update allocation
      await vault.connect(user1).setProtocolAllocation("Aave", newAllocation);
      const updatedAllocation = await vault.getProtocolAllocation("Aave");
      expect(updatedAllocation).to.equal(newAllocation);

      // Aave balance should remain unchanged
      const aaveBalance = await vault.getAaveBalance();
      expect(aaveBalance).to.equal(initialAllocation);
    });
  });

  describe("Aave Integration Events", function () {
    it("Should emit ProtocolDeployed event on Aave deployment", async function () {
      const deployAmount = ethers.parseEther("250");

      await expect(vault.connect(user1).deployToAave(deployAmount))
        .to.emit(vault, "ProtocolDeployed")
        .withArgs("Aave", deployAmount);
    });

    it("Should emit ProtocolWithdrawn event on Aave withdrawal", async function () {
      const deployAmount = ethers.parseEther("300");
      const withdrawAmount = ethers.parseEther("100");

      // Deploy first
      await vault.connect(user1).deployToAave(deployAmount);

      // Withdraw
      await expect(vault.connect(user1).withdrawFromAave(withdrawAmount))
        .to.emit(vault, "ProtocolWithdrawn")
        .withArgs("Aave", withdrawAmount);
    });

    it("Should emit multiple events for multiple operations", async function () {
      const amount1 = ethers.parseEther("200");
      const amount2 = ethers.parseEther("100");

      // First deployment
      await expect(vault.connect(user1).deployToAave(amount1))
        .to.emit(vault, "ProtocolDeployed")
        .withArgs("Aave", amount1);

      // Second deployment
      await expect(vault.connect(user1).deployToAave(amount2))
        .to.emit(vault, "ProtocolDeployed")
        .withArgs("Aave", amount2);

      // Withdrawal
      await expect(vault.connect(user1).withdrawFromAave(amount1))
        .to.emit(vault, "ProtocolWithdrawn")
        .withArgs("Aave", amount1);
    });
  });
});
