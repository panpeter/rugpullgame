# Rug Pull Game

Rug Pull game is developed by Piotr Wilczek as a side project to dive into smart contracts and web3. It's been deployed on Polygon blockchain and its address is [0xd395F51969A9d1A91F9ee726bf25303d9FEE4c2E](https://polygonscan.com/address/0xd395F51969A9d1A91F9ee726bf25303d9FEE4c2E). The website is available at https://rugpullgame.xyz/

## Rules of the game

The game is based on the [bidding fee auction](https://en.wikipedia.org/wiki/Bidding_fee_auction) with the exception that there are no fees and the winner does not pay anything to receive the reward.

To participate the player has to "pump" by calling the pump contract method with 1 MATIC. This 1 MATIC is added to the reward pool.

After 30 blocks, if nobody else pumps, the player can call do the rug pull by calling "rugPull" method and receive the whole reward pool.

If someone else pumps, they need to wait 30 blocks, and if nobody else pumps they can call "rugPull" method and receive the reward pull. And so on...

In case two players pump in the same block and call the rug pull, the reward is split between them.

## Playing script

To initiate the game there is a [play.js](https://github.com/panpeter/rugpullgame/blob/main/contracts/scripts/play.js) script that runs a simple playing script. It uses three accounts to pump and do rug pulls. It's very easy to beat but I won't say how 😊 The code is public so anyone with basic programming knowledge can guess its actions and win.

## Useful commands
```
// Test the contract
npx hardhat test

// Deploy the contract to the mainnet 
npx hardhat run scripts/deploy.js --network polygon_mainnet

// Verify the contract on Polygonscan
npx hardhat verify --network polygon_mainnet [contract_address]

// Run playing script
npx hardhat run scripts/play.js --network polygon_mainnet
```

## Tools used in this project
- [Hardhat](https://hardhat.org/) - ethereum development environment
- [Waffle](https://getwaffle.io/) - smart contracts testing
- [Chai](https://www.chaijs.com/) - assertion library
- [Ethers](https://docs.ethers.io/) - library to interact with a blockchain 
- [Polygonscan](https://polygonscan.com/) - chain explorer
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) - battle-tested libraries of smart contracts
- [Alchemy](https://www.alchemy.com/) - blockchain API
- [Netlify](https://www.netlify.com/) - simple hosting solution
- [Twemoji](https://twemoji.twitter.com/) - emoji for the favicon

To keep code simple the frontend uses pure HTML, CSS, and JS.

## Disclaimer

The contract is fairly simple and thoroughly tested but there is no guarantee that it is fault-free. It is provided “as is," and you use the contract and the website at your own risk.
