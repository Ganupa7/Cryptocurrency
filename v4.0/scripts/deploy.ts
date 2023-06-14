const { ethers, upgrades } = require("hardhat");

async function main() {
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await upgrades.deployProxy(MyNFT, ["My NFT", "NFT"], { initializer: 'initialize' });
  await myNFT.deployed();
  console.log("MyNFT deployed to:", myNFT.address);

  const tx = await myNFT.createCollectible();
  const receipt = await tx.wait();
  const tokenId = receipt.events[0].args[2].toNumber(); // get tokenId from event logs
  console.log("NFT token ID:", tokenId);

  const NFTDutchAuction_ERC20Bids = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
  const dutchAuction = await upgrades.deployProxy(
      NFTDutchAuction_ERC20Bids, 
      [
        "0x5FbDB2315678afecb367f032d93F642f64180aa3", 
        "0x5FbDB2315678afecb367f032d93F642f64180aa3", 
        tokenId, 
        ethers.BigNumber.from(ethers.utils.parseEther("1")), // Convert to BigNumber
        ethers.BigNumber.from(240), // Convert to BigNumber
        ethers.BigNumber.from(1) // Convert to BigNumber
      ], 
      {initializer: 'initialize'}
  );
  console.log("NFTDutchAuction_ERC20Bids deployed to:", dutchAuction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
