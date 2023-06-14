// scripts/deployERC20.ts

const { ethers } = require("hardhat");

async function main() {
    const ERC20 = await ethers.getContractFactory("MyToken");
    const initialSupply = ethers.utils.parseEther("1000"); // Mint 1000 tokens initially

    const erc20 = await ERC20.deploy(initialSupply);
    await erc20.deployed();
    console.log("ERC20 deployed to:", erc20.address);
}

main();
