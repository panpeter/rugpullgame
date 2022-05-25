# Rug Pull Game

Rug Pull game is developed by Piotr Wilczek as a side project to dive into smart contracts and web3. It's been deployed on Polygon blockchain and its address is [0x3bc9Fa2CbA7090aa3Eb7F8d24C66098B5E429312](https://polygonscan.com/address/0x3bc9Fa2CbA7090aa3Eb7F8d24C66098B5E429312). The website is available at https://rugpullgame.xyz/

## Rules of the game

The game is based on the [bidding fee auction](https://en.wikipedia.org/wiki/Bidding_fee_auction).

To participate the player has to "pump" by calling the pump contract method with 1% of the reward pool. This is added to the reward pool.

After 30 blocks, if nobody else pumps, the player can call do the rug pull by calling "rugPull" method and receive the reward pool. Small portion is transferred to developer account to support further work.

If someone else pumps, they need to wait 30 blocks, and if nobody else pumps they can call "rugPull" method and receive the reward pull. And so on...

## Playing script

To initiate the game there is a [play.js](https://github.com/panpeter/rugpullgame/blob/main/contracts/scripts/play.js) script that runs a simple playing script. It uses three accounts to pump and do rug pulls. It's very easy to beat but I won't say how 😊 The code is public so anyone with basic programming knowledge can guess its actions and win.

## Useful commands
```
// Test the contract
npx hardhat test

// Deploy the contract to the mainnet 
npx hardhat run scripts/deploy.js --network polygon_mainnet

// Verify the contract on PolygonScan
npx hardhat verify --network polygon_mainnet [contract_address]

// Run playing script
npx hardhat run scripts/play.js --network polygon_mainnet
```

## Tools used in this project
- [React](https://reactjs.org/) - js library for building user interfaces
- [Redux](https://redux.js.org/) - state container for js apps
- [Hardhat](https://hardhat.org/) - ethereum development environment
- [Waffle](https://getwaffle.io/) - smart contracts testing
- [Chai](https://www.chaijs.com/) - assertion library
- [Ethers](https://docs.ethers.io/) - library to interact with a blockchain 
- [BscScan](https://bscscan.com/) - chain explorer
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) - battle-tested libraries of smart contracts
- [Moralis](https://moralis.io/) - blockchain API
- [Netlify](https://www.netlify.com/) - simple hosting solution
- [Twemoji](https://twemoji.twitter.com/) - emoji for the favicon

To keep code simple the frontend uses pure HTML, CSS, and JS.

## Disclaimer

The contract is fairly simple and thoroughly tested but there is no guarantee that it is fault-free. It is provided “as is," and you use the contract and the website at your own risk.
