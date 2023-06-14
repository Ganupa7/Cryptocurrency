// scripts/deployERC721.ts

const { ethers } = require("hardhat");

async function main() {
    const ERC721 = await ethers.getContractFactory("MyNFT");
    const erc721 = await ERC721.deploy("MyNFTName", "MNFT");
    await erc721.deployed();
    console.log("ERC721 deployed to:", erc721.address);
}

main();
