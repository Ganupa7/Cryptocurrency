const { ethers, upgrades } = require("hardhat");

async function main() {
  const NFTDutchAuction_ERC20BidsV2 = await ethers.getContractFactory("NFTDutchAuction_ERC20BidsV2");
  const dutchAuctionAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; // replace with your contract address
  await upgrades.upgradeProxy(dutchAuctionAddress, NFTDutchAuction_ERC20BidsV2);
  console.log("NFTDutchAuction_ERC20Bids upgraded to V2");

  const dutchAuction = await ethers.getContractAt("NFTDutchAuction_ERC20BidsV2", dutchAuctionAddress);
  const result = await dutchAuction.newFunction();
  console.log("Result from new function:", result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
