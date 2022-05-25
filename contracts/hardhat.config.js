/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config()
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")

const {
   POLYGON_MUMBAI_API_URL,
   POLYGON_MUMBAI_PRIVATE_KEY,
   POLYGON_MAINNET_API_URL,
   POLYGON_MAINNET_PRIVATE_KEY,
   POLYGONSCAN_KEY,

   BNB_TESTNET_API_URL,
   BNB_TESTNET_PRIVATE_KEY,
   BNB_MAINNET_API_URL,
   BNB_MAINNET_PRIVATE_KEY,
   BNBSCAN_MAINNET_KEY,
} = process.env;

module.exports = {
   solidity: {
      version: "0.8.0",
      settings: {
         optimizer: {
            enabled: true,
            runs: 999,
         },
      },
   },
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
      },
      bnb_testnet: {
         url: BNB_TESTNET_API_URL,
         accounts: [`0x${BNB_TESTNET_PRIVATE_KEY}`]
      },
      bnb_mainnet: {
         url: BNB_MAINNET_API_URL,
         accounts: [`0x${BNB_MAINNET_PRIVATE_KEY}`]
      }
   },
   etherscan: {
      apiKey: POLYGONSCAN_KEY,
   },
}
