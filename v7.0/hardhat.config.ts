import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
const INFURA_API_KEY = "fa763e068d094c9ca50216597522d5f3";
const PRIVATE_KEY = "b8c7e6122426b53b432e439a54a20a3a1ac2106ee7748ceb81894435c3ca4984";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    // your network config
    goerli: {
        url: `https://goerli.infura.io/v3/fa763e068d094c9ca50216597522d5f3`,
        accounts: [`0x${PRIVATE_KEY}`]
  }
},
  mocha: {
    timeout: 20000
  }

};

export default config;
