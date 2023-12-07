require('@nomicfoundation/hardhat-toolbox');
const ALCHEMY_API_KEY = "pTfjX3dTcamOIcdCt63iRzga8n8dDG5a";

module.exports = {
  solidity: "0.8.17",
  paths: {
    artifacts: "./app/src/artifacts",
  },
  networks: {
    sepolia: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  }
};
