/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
const {
   POLYGON_MUMBAI_API_URL,
   POLYGON_MUMBAI_PRIVATE_KEY,
   POLYGON_MAINNET_API_URL,
   POLYGON_MAINNET_PRIVATE_KEY
} = process.env;
module.exports = {
   solidity: "0.8.0",
   defaultNetwork: "hardhat",
   networks: {
      hardhat: {},
      polygon_mumbai: {
         url: POLYGON_MUMBAI_API_URL,
         accounts: [`0x${POLYGON_MUMBAI_PRIVATE_KEY}`]
      },
      polygon_mainnet: {
         url: POLYGON_MAINNET_API_URL,
         accounts: [`0x${POLYGON_MAINNET_PRIVATE_KEY}`]
      }
   },
   settings: {
      optimizer: {
         enabled: true,
         runs: 999999,
      },
   },
}
