require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  paths: {
    sources: "./contracts",
  },
  networks: {
    hardhat: {
      chainId: 1337
    }
  },
  mocha: {
    reporter: 'json',
  },
};
