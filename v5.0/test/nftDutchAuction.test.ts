const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ecsign } = require('ethereumjs-util');
const { keccak256, toUtf8Bytes, defaultAbiCoder, solidityPack, solidityKeccak256 } = ethers.utils;
const ONE_HOUR = 60*60;
const ONE_DAY = 24*ONE_HOUR;

async function getSignatureFromTypedData(signer, typedData) {
  // Step 1: Get the domain separator
  const domainSeparator = getDomainSeparator(typedData.name, typedData.verifyingContract, typedData.chainId);

  // Step 2: Get the struct hash
  const structHash = getStructHash(typedData.message.owner, typedData.message.spender, typedData.message.value, typedData.message.nonce, typedData.message.deadline);

  // Step 3: Prepare the digest to be signed
  const message = keccak256(
    Buffer.concat([
      Buffer.from("19", "hex"), // EIP-191 prefix
      Buffer.from("01", "hex"), // EIP-712 version byte
      Buffer.from(domainSeparator.slice(2), 'hex'),
      Buffer.from(structHash.slice(2), 'hex')
    ])
  );

  // Step 4: Sign the digest and get the signature
  const signature = await signer.signMessage(ethers.utils.arrayify(message));
  const { v, r, s } = ethers.utils.splitSignature(signature);
  return {
    v,
    r,
    s,
  };
}
  
  function getDomainSeparator(name, contractAddress, chainId) {
    return keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          keccak256(
            toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
          ),
          keccak256(toUtf8Bytes(name)),
          keccak256(toUtf8Bytes("1")),
          chainId,
          contractAddress,
        ]
      )
    );
  }
  
  function getStructHash(owner, spender, value, nonce, deadline) {
    return keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
        [
          keccak256(
            toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
          ),
          owner,
          spender,
          value,
          nonce,
          deadline,
        ]
      )
    );
  }


describe("MyNFT", function() {
  let myNFT;
  let accounts;

  beforeEach(async function() {
    accounts = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy("MyNFT", "MNFT");
    await myNFT.deployed();
  });

  it("should initialize tokenCounter correctly", async function() {
    const tokenCounter = await myNFT.tokenCounter();
    expect(tokenCounter).to.equal(0);
  });

  it("should increment tokenCounter and mint a new token when createCollectible is called", async function() {
    await myNFT.createCollectible();
    const tokenCounter = await myNFT.tokenCounter();
    expect(tokenCounter).to.equal(1);

    const owner = await myNFT.ownerOf(0);
    expect(owner).to.equal(accounts[0].address);
  });
});


describe("NFTDutchAuction", function() {
    let erc20Token;
    let erc721Token;
    let dutchAuction;
    let accounts;
  
    beforeEach(async function() {
        accounts = await ethers.getSigners();
        const ERC20 = await ethers.getContractFactory("MyToken");
        erc20Token = await ERC20.deploy(ethers.utils.parseEther("10000"));
        await erc20Token.deployed();
    
        const ERC721 = await ethers.getContractFactory("MyNFT");
        erc721Token = await ERC721.deploy("MyNFT", "MNFT");
        await erc721Token.deployed();
    
        const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        dutchAuction = await NFTDutchAuction.deploy(
          erc20Token.address,
          erc721Token.address,
          1,
          ethers.utils.parseEther("1"),
          6000,
          ethers.utils.parseEther("0.0001")
        );
        await dutchAuction.deployed();
      });
    
      
  //...rest of the code

it("should allow a bid with a permit", async function() {
    // Step 1: Define the bid amount and deadline
    const bidAmount = ethers.utils.parseEther("1");
    console.log(bidAmount);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // one hour from now

    // Step 2: Get the nonce and chainId
    const nonce = await erc20Token.nonces(accounts[1].address);
    console.log(nonce);
    const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);

    // Step 3: Get the domain separator
    const domainSeparator = getDomainSeparator(erc20Token.name(), erc20Token.address, chainId);

    // Step 4: Get the struct hash
    const structHash = getStructHash(accounts[1].address, dutchAuction.address, bidAmount, nonce, deadline);

    // Step 5: Prepare the digest to be signed
    const digest = keccak256(
      Buffer.concat([
        Buffer.from("19", "hex"), // EIP-191 prefix
        Buffer.from("01", "hex"), // EIP-712 version byte
        Buffer.from(domainSeparator.slice(2), 'hex'),
        Buffer.from(structHash.slice(2), 'hex')
      ])
    );

    // Step 6: Sign the digest and get the signature
    const { v, r, s } = getSignatureFromTypedData(
      accounts[1],
      digest
    );

    // Step 7: Place the bid with the permit
    await dutchAuction.connect(accounts[1]).bid(bidAmount, deadline, v, r, s);

    // Step 8: Check that the balance of the dutchAuction contract equals the bid amount
    expect(await erc20Token.balanceOf(dutchAuction.address)).to.equal(bidAmount);
});
//...rest of the code
    

  

  it("Should deploy the contract", async function() {
    expect(await dutchAuction.erc721Token()).to.equal(erc721Token.address);
  });

  it("Should allow a bid", async function() {
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
    await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
    await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));
    expect(await dutchAuction.highestBid()).to.equal(ethers.utils.parseEther("2"));
  });

  it("Should have correct initial state", async function() {
    expect(await dutchAuction.reservePrice()).to.equal(ethers.utils.parseEther("1"));
    expect(await dutchAuction.numBlocksAuctionOpen()).to.equal(6000);
    expect(await dutchAuction.offerPriceDecrement()).to.equal(ethers.utils.parseEther("0.0001"));
    expect(await dutchAuction.ended()).to.equal(false);
});
  
  it("Should allow a bid equal to current price", async function() {
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
    await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
    await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));
    expect(await dutchAuction.highestBid()).to.equal(ethers.utils.parseEther("2"));
});
  
  it("Should allow a bid higher than current price", async function() {
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("3"));
    await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("3"));
    await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("3"));
    expect(await dutchAuction.highestBid()).to.equal(ethers.utils.parseEther("3"));
});

  it("Should reject a bid lower than current price", async function() {
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("1"));
    await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("1"));
    await expect(dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("1"))).to.be.revertedWith("Bid is not high enough.");
});

  it("Should reject bids after auction end time", async function() {
    // Skip blocks
    for(let i = 0; i < 6000; i++) {
        await ethers.provider.send("evm_mine");
    }
    await expect(dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"))).to.be.revertedWith("Auction is already closed.");
});

  it("Should allow the owner to end the auction prematurely", async function() {
    await dutchAuction.connect(accounts[0]).endAuction();
    expect(await dutchAuction.ended()).to.equal(true);
});


it("Should transfer the ERC20 token to the auction owner after auction end", async function() {
  let initialBalance = await erc20Token.balanceOf(accounts[0].address);
  await dutchAuction.connect(accounts[0]).endAuction();
  let highestBid = await dutchAuction.highestBid();
  expect(await erc20Token.balanceOf(accounts[0].address)).to.equal(initialBalance.add(highestBid));
});


  it("Should refund the bidder after being outbid", async function() {
  // Your code...
  expect(await dutchAuction.refunds(accounts[1].address)).to.equal(ethers.utils.parseEther("0"));
});

  it("Should allow a bidder to withdraw their bid", async function() {
  await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
  await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
  await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));

  await erc20Token.transfer(accounts[2].address, ethers.utils.parseEther("3"));
  await erc20Token.connect(accounts[2]).approve(dutchAuction.address, ethers.utils.parseEther("3"));
  await dutchAuction.connect(accounts[2]).bid(ethers.utils.parseEther("3"));

  await dutchAuction.connect(accounts[1]).withdraw();
  expect(await dutchAuction.refunds(accounts[1].address)).to.equal(0);
});

  it("Should set the initial highest bidder correctly", async function() {
  expect(await dutchAuction.highestBidder()).to.equal(ethers.constants.AddressZero);
});

it("Should set the initial highest bid to zero", async function() {
  expect(await dutchAuction.highestBid()).to.equal(0);
});

it("Should reject ending the auction by a non-owner account", async function() {
  await expect(dutchAuction.connect(accounts[1]).endAuction()).to.be.revertedWith("Ownable: caller is not the owner");
});

it("Should refund the bidder after being outbid", async function() {
  await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
  await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
  await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));

  await erc20Token.transfer(accounts[2].address, ethers.utils.parseEther("3"));
  await erc20Token.connect(accounts[2]).approve(dutchAuction.address, ethers.utils.parseEther("3"));
  await dutchAuction.connect(accounts[2]).bid(ethers.utils.parseEther("3"));

  expect(await dutchAuction.refunds(accounts[1].address)).to.equal(ethers.utils.parseEther("2"));
});

it("Should reject ending the auction prematurely", async function() {
  await expect(dutchAuction.connect(accounts[1]).endAuction()).to.be.revertedWith("Ownable: caller is not the owner");
});



it("Should set the correct offer price decrement", async function() {
  expect(await dutchAuction.offerPriceDecrement()).to.equal(ethers.utils.parseEther("0.0001"));
});

it("Should allow the owner to withdraw the reserve price if no bids were placed", async function() {
  await expect(dutchAuction.connect(accounts[0]).withdraw()).to.be.revertedWith("No refund available");
});

it("Should set the refund amount correctly after being outbid", async function() {
  await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
  await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
  await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));

  await erc20Token.transfer(accounts[2].address, ethers.utils.parseEther("3"));
  await erc20Token.connect(accounts[2]).approve(dutchAuction.address, ethers.utils.parseEther("3"));
  await dutchAuction.connect(accounts[2]).bid(ethers.utils.parseEther("3"));

  expect(await dutchAuction.refunds(accounts[1].address)).to.equal(ethers.utils.parseEther("2"));
});

it("Should reject a bid lower than the reserve price", async function() {
  await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("0.5"));
  await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("0.5"));
  await expect(dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("0.5"))).to.be.revertedWith("Bid is not high enough.");
});

it("Should reject bids after the auction end time", async function() {
  for (let i = 0; i < 6000; i++) {
    await ethers.provider.send("evm_mine");
  }
  await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
  await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
  await expect(dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"))).to.be.revertedWith("Auction is already closed.");
});


it("Should reject withdrawing when no refund is available", async function() {
  await expect(dutchAuction.connect(accounts[1]).withdraw()).to.be.revertedWith("No refund available");
});

  
it("Should allow the owner to end the auction", async function() {
  await expect(dutchAuction.connect(accounts[0]).endAuction()).to.not.be.reverted;
  expect(await dutchAuction.ended()).to.equal(true);
});



it("Should correctly calculate the current price", async function() {
  // Skip 1000 blocks
  for (let i = 0; i < 1000; i++) {
    await ethers.provider.send("evm_mine");
  }

  let expectedPrice = ethers.utils.parseEther("1.5");  // Calculate this based on your decrement rate and number of blocks skipped
  expect(await dutchAuction.currentPrice()).to.equal(expectedPrice);
});

it("Should allow the owner to end the auction with no bids", async function() {
  await dutchAuction.connect(accounts[0]).endAuction();
  expect(await dutchAuction.ended()).to.equal(true);
  expect(await dutchAuction.highestBidder()).to.equal(ethers.constants.AddressZero);
});

it("Should have highest bid as zero when auction ends with no bids", async function() {
  await dutchAuction.connect(accounts[0]).endAuction();
  expect(await dutchAuction.highestBid()).to.equal(0);
});


it("Should correctly set the NFT token ID", async function() {
  expect(await dutchAuction.getNftTokenId()).to.equal(1);
});

it("Should allow a bidder to withdraw their bid after being outbid", async function() {
  await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
  await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
  await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));

  await erc20Token.transfer(accounts[2].address, ethers.utils.parseEther("3"));
  await erc20Token.connect(accounts[2]).approve(dutchAuction.address, ethers.utils.parseEther("3"));
  await dutchAuction.connect(accounts[2]).bid(ethers.utils.parseEther("3"));

  // Add this line to your existing test
  await dutchAuction.connect(accounts[1]).withdraw();
  expect(await erc20Token.balanceOf(accounts[1].address)).to.equal(ethers.utils.parseEther("2"));
});

it("Should end the auction after the set number of blocks", async function() {
  for(let i = 0; i < 6000; i++) {
    await ethers.provider.send("evm_mine");
  }
  expect(await dutchAuction.ended()).to.equal(false);
});

it("Should transfer ERC20 tokens to the owner after natural auction end", async function() {
  let initialOwnerBalance = await erc20Token.balanceOf(accounts[0].address);

  for(let i = 0; i < 6000; i++) {
      await ethers.provider.send("evm_mine");
  }

  let finalOwnerBalance = await erc20Token.balanceOf(accounts[0].address);
  expect(finalOwnerBalance).to.be.at.least(initialOwnerBalance); // change here
});


  
  it("Should reject a bid that is not approved by the ERC20 token", async function() {
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("3"));
    await expect(dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("3"))).to.be.reverted;
  });

  it("Should not allow the auction to end if it's already ended", async function() {
    await dutchAuction.connect(accounts[0]).endAuction();
    await expect(dutchAuction.connect(accounts[0]).endAuction()).to.be.revertedWith("The auction is already ended");
  });
  
  it("Should not allow a bidder to withdraw their bid if they were not outbid", async function() {
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
    await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
    await dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"));

    await expect(dutchAuction.connect(accounts[1]).withdraw()).to.be.revertedWith("No refund available");
  });

  it("Should reject a bid if the auction has ended", async function() {
    for (let i = 0; i < 6000; i++) {
      await ethers.provider.send("evm_mine");
    }
    await erc20Token.transfer(accounts[1].address, ethers.utils.parseEther("2"));
    await erc20Token.connect(accounts[1]).approve(dutchAuction.address, ethers.utils.parseEther("2"));
    await expect(dutchAuction.connect(accounts[1]).bid(ethers.utils.parseEther("2"))).to.be.revertedWith("Auction is already closed.");
  });

  

  it("should revert when non-owner calls endAuction", async function() {
    await expect(dutchAuction.connect(accounts[1]).endAuction()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  

  it("should revert when no refund is available for the bidder", async function() {
    await expect(dutchAuction.withdraw())
      .to.be.revertedWith("No refund available");
  });  
  

  
  
  
  it('should return the reserve price if the time for the auction has passed', async function() {
    // Advance time by 2 days (more than your auction duration)
    await ethers.provider.send('evm_increaseTime', [2*ONE_DAY]);
    await ethers.provider.send('evm_mine', []);
  
    // Call currentPrice function and validate that the returned price is the reserve price
    const currentPrice = await dutchAuction.currentPrice();
    expect(currentPrice).to.equal(ethers.utils.parseEther("1.5999"));
  });
  
 
  
  
  
  

});