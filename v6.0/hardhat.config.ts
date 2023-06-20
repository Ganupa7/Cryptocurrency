import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    // your network config
  },
  mocha: {
    timeout: 20000
  }
};

export default config;
