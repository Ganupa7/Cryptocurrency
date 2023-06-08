import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
};
export default config;
