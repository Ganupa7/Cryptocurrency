const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const ERC20Token = await hre.ethers.getContractFactory("ERC20");
    const erc20Token = await ERC20Token.deploy();
    await erc20Token.deployed();

    const ERC721Token = await hre.ethers.getContractFactory("ERC721");
    const erc721Token = await ERC721Token.deploy();
    await erc721Token.deployed();

    console.log("ERC20 deployed to:", erc20Token.address);
    console.log("ERC721 deployed to:", erc721Token.address);

    const DutchAuction = await hre.ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
    const dutchAuction = await DutchAuction.deploy(erc20Token.address, erc721Token.address, 1, 1000, 10, 100);
    await dutchAuction.deployed();

    console.log("Dutch auction deployed to:", dutchAuction.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
