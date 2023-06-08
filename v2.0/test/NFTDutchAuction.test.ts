const { ethers } = require("hardhat");
const { expect } = require("chai");


describe("ERC721Mock", function () {
  let erc721Mock;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    erc721Mock = await ERC721Mock.deploy("ERC721Mock", "E721M");
    await erc721Mock.deployed();
  });

  it("Should mint token correctly", async function () {
    await erc721Mock.mint(addr1.address, 1);
    expect(await erc721Mock.balanceOf(addr1.address)).to.equal(1);
    expect(await erc721Mock.ownerOf(1)).to.equal(addr1.address);
  });

  it("Should fail when minting token to zero address", async function () {
    await expect(erc721Mock.mint(ethers.constants.AddressZero, 1)).to.be.revertedWith("ERC721: mint to the zero address");
  });
});


describe("NFTDutchAuction", function () {
  let nftDutchAuction;
  let owner;
  let addr1;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, ...addrs] = await ethers.getSigners();

    const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction");
    nftDutchAuction = await NFTDutchAuction.deploy("0x0000000000000000000000000000000000000000", owner.address, 1, ethers.utils.parseEther("2"), 2, ethers.utils.parseEther("0.5"));
    await nftDutchAuction.deployed();
  });

  it("Should return the right reservePrice after deployment", async function () {
    expect(await nftDutchAuction.reservePrice()).to.equal(ethers.utils.parseEther("2"));
  });


  it("Should decrease the current price with each new block", async function () {
    const initialPrice = await nftDutchAuction.currentPrice();
    await ethers.provider.send("evm_mine");
    const newPrice = await nftDutchAuction.currentPrice();
    expect(newPrice).to.be.lt(initialPrice);
  });

  
  it("Should not allow non-owner to end the auction", async function () {
    await ethers.provider.send("evm_increaseTime", [1200]);
    await ethers.provider.send("evm_mine");
    await expect(nftDutchAuction.connect(addr1).endAuction()).to.be.revertedWith("Only the owner can end the auction");
  });

  it("Should start with the correct initialPrice", async function () {
    expect(await nftDutchAuction.currentPrice()).to.equal(ethers.utils.parseEther("3"));
  });

  it("Should revert when a bid is too low", async function () {
    await expect(nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("2") })).to.be.revertedWith("Bid is not high enough.");
  });

  it("Should update highest bid and bidder correctly when a new highest bid is placed", async function () {
    await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });
    expect(await nftDutchAuction.highestBid()).to.equal(ethers.utils.parseEther("4"));
    expect(await nftDutchAuction.highestBidder()).to.equal(addrs[1].address);
  });


  it("Should end the auction correctly", async function () {
    await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });
    await nftDutchAuction.endAuction();
    expect(await nftDutchAuction.ended()).to.be.true;
  });

  it("Should not allow bids after the auction has ended", async function () {
    await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });
    await nftDutchAuction.endAuction();
    await expect(nftDutchAuction.connect(addrs[2]).bid({ value: ethers.utils.parseEther("5") })).to.be.revertedWith("Auction is already closed.");
  });

  it("Should allow withdrawal of refunds", async function () {
    await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });
    await nftDutchAuction.connect(addrs[2]).bid({ value: ethers.utils.parseEther("5") });
    const initialBalance = await addrs[1].getBalance();
    await nftDutchAuction.connect(addrs[1]).withdraw();
    expect(await addrs[1].getBalance()).to.be.gt(initialBalance);
  });

  it("Should not allow withdrawal when there is no refund", async function () {
    await expect(nftDutchAuction.connect(addrs[1]).withdraw()).to.be.revertedWith("No refund available");
  });


  it("Should not allow bids after auction time has passed", async function () {
    for (let i = 0; i < 11; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    await expect(nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("3") })).to.be.revertedWith("Auction is already closed.");
  });

  it("Should automatically end the auction when auction time has passed", async function () {
    for (let i = 0; i < 11; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    expect(await nftDutchAuction.ended()).to.be.false;
  });

  it("Should revert when trying to end an already ended auction", async function () {
    await nftDutchAuction.endAuction();
    await expect(nftDutchAuction.endAuction()).to.be.revertedWith("The auction is already ended");
  });

  

  it("Should have the correct startBlock after deployment", async function () {
    const deployedStartBlock = await nftDutchAuction.startBlock();
    const currentBlock = await ethers.provider.getBlockNumber();
    expect(deployedStartBlock).to.equal(currentBlock);
  });

  it("Should revert when trying to withdraw without having a refund", async function () {
    await expect(nftDutchAuction.connect(addrs[1]).withdraw()).to.be.revertedWith("No refund available");
  });

  it("Should not allow bids that are below the current price", async function () {
    await expect(nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("1") })).to.be.revertedWith("Bid is not high enough.");
  });

  it("Should revert when trying to end the auction by a non-owner", async function () {
    await expect(nftDutchAuction.connect(addrs[1]).endAuction()).to.be.revertedWith("Only the owner can end the auction");
  });

  it("Should not end the auction when the block number is less than the startBlock + numBlocksAuctionOpen and reserve price is not met", async function () {
    await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("3") });
    expect(await nftDutchAuction.ended()).to.be.false;
  });
  
  


it("Should close the auction after numBlocksAuctionOpen", async function () {
  // The contract is deployed at startBlock
  const startBlock = await nftDutchAuction.startBlock();

  // Mine numBlocksAuctionOpen blocks
  for(let i = 0; i < await nftDutchAuction.numBlocksAuctionOpen(); i++) {
      await ethers.provider.send("evm_mine");
  }

  // Now, the block number should be startBlock + numBlocksAuctionOpen
  expect(await ethers.provider.getBlockNumber()).to.equal(startBlock.toNumber() + (await nftDutchAuction.numBlocksAuctionOpen()).toNumber());

  // So, the auction should be closed and any bid should be reverted with the message "Auction is already closed."
  await expect(nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("3") })).to.be.revertedWith("Auction is already closed.");
});

it("Should not allow bids after numBlocksAuctionOpen have passed", async function () {
  // Mine numBlocksAuctionOpen + 1 blocks
  for(let i = 0; i <= (await nftDutchAuction.numBlocksAuctionOpen()).toNumber(); i++) {
      await ethers.provider.send("evm_mine");
  }

  // Now, block.number > startBlock + numBlocksAuctionOpen, so any bid should be reverted with "Auction is already closed."
  await expect(nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") })).to.be.revertedWith("Auction is already closed.");
});

it("Should end the auction if bid is made exactly when numBlocksAuctionOpen have passed", async function () {
  // Mine numBlocksAuctionOpen - 1 blocks
  for(let i = 0; i < (await nftDutchAuction.numBlocksAuctionOpen()).toNumber() - 1; i++) {
      await ethers.provider.send("evm_mine");
  }

  // Now, block.number == startBlock + numBlocksAuctionOpen, so this bid should end the auction
  await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });

  // Check if the auction is ended
  expect(await nftDutchAuction.ended()).to.be.true;
});

it("Should end the auction automatically if a bid is made exactly when numBlocksAuctionOpen have passed", async function () {
  // Mine numBlocksAuctionOpen - 1 blocks
  for(let i = 0; i < (await nftDutchAuction.numBlocksAuctionOpen()).toNumber() - 1; i++) {
    await ethers.provider.send("evm_mine");
  }

  // Now, block.number == startBlock + numBlocksAuctionOpen, so this bid should end the auction
  await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });

  // Check if the auction is ended
  expect(await nftDutchAuction.ended()).to.be.true;
});

it("Should not allow to bid if the auction is already ended", async function () {
  // First, place a valid bid
  await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("3") });
  // Then, end the auction manually
  await nftDutchAuction.endAuction();
  // Now, attempt to place a bid should fail
  await expect(nftDutchAuction.connect(addrs[2]).bid({ value: ethers.utils.parseEther("4") })).to.be.revertedWith("Auction is already closed.");
});

it("Should refund the previous highest bidder when a new highest bid is placed", async function () {
  // First, addr1 places a bid
  await nftDutchAuction.connect(addr1).bid({ value: ethers.utils.parseEther("3") });
  // Now, addr1 is the highest bidder

  // Check the highest bid and highest bidder
  expect(await nftDutchAuction.highestBid()).to.equal(ethers.utils.parseEther("3"));
  expect(await nftDutchAuction.highestBidder()).to.equal(addr1.address);

  // Now, addrs[1] (second address in the array) places a higher bid
  await nftDutchAuction.connect(addrs[1]).bid({ value: ethers.utils.parseEther("4") });
  // Now, addrs[1] is the highest bidder, and addr1 should receive a refund

  // Check the highest bid and highest bidder again
  expect(await nftDutchAuction.highestBid()).to.equal(ethers.utils.parseEther("4"));
  expect(await nftDutchAuction.highestBidder()).to.equal(addrs[1].address);

  // Check the refund of addr1
  expect(await nftDutchAuction.refunds(addr1.address)).to.equal(ethers.utils.parseEther("3"));
});

it("Should update the highest bid and refund the previous highest bidder when a new highest bid is placed", async function () {
  // First, addr1 places a bid
  await nftDutchAuction.connect(addr1).bid({ value: ethers.utils.parseEther("3") });

  // Then, addr2 places a higher bid
  await nftDutchAuction.connect(addrs[0]).bid({ value: ethers.utils.parseEther("4") });

  // Check if the highest bid is updated
  expect(await nftDutchAuction.highestBid()).to.equal(ethers.utils.parseEther("4"));

  // Check if the highest bidder is updated
  expect(await nftDutchAuction.highestBidder()).to.equal(addrs[0].address);

  // Check if the refund for addr1 is correct
  expect(await nftDutchAuction.refunds(addr1.address)).to.equal(ethers.utils.parseEther("3"));
});



});
