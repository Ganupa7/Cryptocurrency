const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BasicDutchAuction", function () {
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let auction;
  let bidder;
  
  
  beforeEach(async function () {
    [owner, bidder, addr1, addr2, ...addrs] = await ethers.getSigners();

    const Auction = await ethers.getContractFactory("BasicDutchAuction");
    auction = await Auction.deploy(10, 100, 1); // values can be adjusted according to your test case needs
    await auction.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });
    it("Should set the initial price correctly", async function () {
      expect(await auction.initialPrice()).to.equal(110);
    });
    
    
  });

  describe("Bidding", function () {
    it("Should update highest bidder on a successful bid", async function () {
      await auction.connect(addr1).bid({ value: ethers.utils.parseEther("2") });
      expect(await auction.highestBidder()).to.equal(addr1.address);
    });
    it("Should refund the previous highest bidder when a new highest bid is placed", async function () {
      await auction.connect(addr1).bid({ value: ethers.utils.parseEther("2") });
      await auction.connect(addr2).bid({ value: ethers.utils.parseEther("3") });
      expect(await auction.refunds(addr1.address)).to.equal(ethers.utils.parseEther("2"));
    });
    it("Should handle bidding with zero value", async function () {
      await expect(auction.connect(addr1).bid({ value: 0 })).to.be.revertedWith("Bid is not high enough.");
    });
    it("Should not allow bidding below the reserve price", async function () {
      const reservePrice = await auction.reservePrice();
      const belowReservePrice = reservePrice.sub(1);

      await expect(auction.connect(addr1).bid({ value: belowReservePrice })).to.be.revertedWith("Bid is not high enough.");
    });
    it("Should not allow bidding after the auction has ended", async function () {
      await auction.connect(addr1).bid({ value: ethers.utils.parseEther("5") });
      await auction.connect(owner).endAuction();

      await expect(auction.connect(addr2).bid({ value: ethers.utils.parseEther("6") })).to.be.revertedWith("Auction is already ended.");
    });
    it("Should not allow bidding below the current price", async function () {
      const currentPrice = await auction.currentPrice();
      const belowCurrentPrice = currentPrice.mul(99).div(100); // Set below the current price by 1%
    
      await expect(auction.connect(addr1).bid({ value: belowCurrentPrice })).to.be.revertedWith("Bid is not high enough.");
    });
    it("Should allow bidding exactly equal to the current price", async function () {
      const currentPrice = await auction.currentPrice();
      await auction.connect(addr1).bid({ value: currentPrice });
      expect(await auction.highestBidder()).to.equal(addr1.address);
    });
    
  });

  describe("Withdrawal", function () {
    it("Should allow users to withdraw their refunds", async function () {
      await auction.connect(addr1).bid({ value: ethers.utils.parseEther("2") });
      await auction.connect(addr2).bid({ value: ethers.utils.parseEther("3") });
      await auction.connect(addr1).withdraw();
      expect(await auction.refunds(addr1.address)).to.equal(0);
    });
  
    it("Should revert when trying to withdraw without any refunds", async function () {
      await expect(auction.connect(addr1).withdraw()).to.be.revertedWith("No refund available");
    });

    it("Should revert if the refund amount is zero", async function () {
      await expect(auction.connect(addr1).withdraw()).to.be.revertedWith("No refund available");
    });
    it("Should handle a refund amount of zero when the bidder has no refund available", async function () {
      await expect(auction.connect(addr1).withdraw()).to.be.revertedWith("No refund available");
    });
    it("Should revert when trying to withdraw without any refunds", async function () {
      await expect(auction.connect(addr1).withdraw()).to.be.revertedWith("No refund available");
    });
    
  });
  
  describe("End of Auction by Blocks", function () {
    it("Should end the auction after numBlocksAuctionOpen blocks have passed", async function() {
      const numBlocks = await auction.numBlocksAuctionOpen();

      // Simulate the passage of blocks but keep one block for the bid
      for (let i = 0; i < numBlocks.toNumber() - 1; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Make a bid before numBlocksAuctionOpen blocks have passed
      await auction.bid({ value: ethers.utils.parseEther("1") });

      // Simulate the passage of the last block
      await ethers.provider.send("evm_mine", []);

      // The auction should be ended now
      const isEnded = await auction.ended();
      expect(isEnded).to.equal(true);
    });

    it("Should transfer highest bid to owner when numBlocksAuctionOpen blocks have passed", async function () {
      const numBlocks = await auction.numBlocksAuctionOpen();
      const highestBid = ethers.utils.parseEther("10");
    
      // Simulate the passage of blocks but keep one block for the bid
      for (let i = 0; i < numBlocks.toNumber() - 1; i++) {
        await ethers.provider.send("evm_mine", []);
      }
    
      // Make a bid before numBlocksAuctionOpen blocks have passed
      await auction.bid({ value: highestBid });
    
      // Simulate the passage of the last block
      await ethers.provider.send("evm_mine", []);
    
      // The auction should be ended now
      const isEnded = await auction.ended();
      expect(isEnded).to.equal(true);
    
      // Check the actual highest bid transferred to the owner
      const highestBidTransferred = await auction.highestBid();
      expect(highestBidTransferred).to.be.gte(highestBid);
    });
    
    
    
});





  describe("Current Price", function () {
    
    it("Should return the correct price when the auction is ongoing", async function () {
      const initialPrice = await auction.initialPrice();
      const currentPrice = await auction.currentPrice();
      expect(currentPrice).to.equal(initialPrice);

      // Advance the block number by 1
      await ethers.provider.send("evm_mine", []);

      const offerPriceDecrement = await auction.offerPriceDecrement();
      const expectedPrice = initialPrice.sub(offerPriceDecrement);
      const newCurrentPrice = await auction.currentPrice();
      expect(newCurrentPrice).to.equal(expectedPrice);
    });
    it("Should return the reserve price if the auction time is zero", async function () {
      const Auction = await ethers.getContractFactory("BasicDutchAuction");
      const auctionWithZeroBlocks = await Auction.deploy(10, 0, 1); // numBlocksAuctionOpen set to zero
      await auctionWithZeroBlocks.deployed();

      const reservePrice = await auctionWithZeroBlocks.reservePrice();
      const currentPrice = await auctionWithZeroBlocks.currentPrice();
      expect(currentPrice).to.equal(reservePrice);
    });
    it("Should handle a single block auction duration", async function () {
      const Auction = await ethers.getContractFactory("BasicDutchAuction");
      const auctionWithOneBlock = await Auction.deploy(10, 1, 5); // numBlocksAuctionOpen set to 1
      await auctionWithOneBlock.deployed();

      const initialPrice = await auctionWithOneBlock.initialPrice();
      const currentPrice = await auctionWithOneBlock.currentPrice();

      expect(currentPrice).to.equal(initialPrice);

      // Advance the block number by 1
      await ethers.provider.send("evm_mine", []);

      const reservePrice = await auctionWithOneBlock.reservePrice();
      const newCurrentPrice = await auctionWithOneBlock.currentPrice();
      expect(newCurrentPrice).to.equal(reservePrice);
    });
    it("Should return the initial price when no blocks have passed", async function () {
      const initialPrice = await auction.initialPrice();
      const currentPrice = await auction.currentPrice();

      expect(currentPrice).to.equal(initialPrice);
    });

  });

  describe("End of Auction", function () {
    it("Should not end the auction if reserve price is met", async function () {
      await auction.connect(addr1).bid({ value: ethers.utils.parseEther("11") }); // reserve price was set to 10
      expect(await auction.ended()).to.equal(false);
    });
    it("Should allow owner to manually end the auction", async function () {
      await auction.connect(owner).endAuction();
      expect(await auction.ended()).to.equal(true);
    });
    it("Should revert if a non-owner tries to manually end the auction", async function () {
      await expect(auction.connect(addr1).endAuction()).to.be.revertedWith("Only the owner can end the auction");
    });
    it("Should not allow non-owner to end the auction", async function () {
      await expect(auction.connect(addr1).endAuction()).to.be.revertedWith("Only the owner can end the auction");
    });
    it("Should revert when trying to end the auction again", async function () {
      await auction.connect(owner).endAuction();

      await expect(auction.connect(owner).endAuction()).to.be.revertedWith("The auction is already ended");
    });
    it("Should transfer highest bid to owner when auction ends", async function () {
      const highestBid = ethers.utils.parseEther("10");
    
      await auction.connect(addr1).bid({ value: highestBid });
      await auction.connect(owner).endAuction();
    
      // Check the actual highest bid transferred to the owner
      const highestBidTransferred = await auction.highestBid();
      expect(highestBidTransferred).to.be.gte(highestBid);
    });
    
    
  });

});
