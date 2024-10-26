require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  paths: {
    sources: "./contracts",
  },
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};
