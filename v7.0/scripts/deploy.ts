import { ethers } from "hardhat";

async function main() {
  const reservePrice = ethers.utils.parseEther("1"); // replace with your value
  const numBlocksAuctionOpen = 100; // replace with your value
  const offerPriceDecrement = ethers.utils.parseEther("0.001"); // replace with your value

  const BasicDutchAuction = await ethers.getContractFactory("BasicDutchAuction");
  const basicDutchAuction = await BasicDutchAuction.deploy(reservePrice, numBlocksAuctionOpen, offerPriceDecrement, {
    gasPrice: ethers.utils.parseUnits("10", "gwei") // adjust gas price as necessary
  });

  console.log("Waiting for transaction to be mined...");
  await basicDutchAuction.deployTransaction.wait();
  
  console.log(
    `BasicDutchAuction deployed to ${basicDutchAuction.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
