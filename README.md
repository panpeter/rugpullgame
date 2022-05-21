# Rug Pull Game

Rug Pull game is developed by Piotr Wilczek as a side project to dive into smart contracts and web3. It's been deployed on BNB blockchain and its address is [0xB55DD5b91Ef815cEc527e054B67f4D298111aD9F](https://bscscan.com/address/0xd395F51969A9d1A91F9ee726bf25303d9FEE4c2E). The website is available at https://rugpullgame.xyz/

## Rules of the game

The game is based on the [bidding fee auction](https://en.wikipedia.org/wiki/Bidding_fee_auction).

To participate the player has to "pump" by calling the pump contract method with 0.005 BNB (~1.5 USD). This 0.005 BNB is added to the reward pool.

After 20 blocks, if nobody else pumps, the player can call do the rug pull by calling "rugPull" method and receive the reward pool. Small portion is transfered to developer account to support further work.

If someone else pumps, they need to wait 20 blocks, and if nobody else pumps they can call "rugPull" method and receive the reward pull. And so on...

## Playing script

To initiate the game there is a [play.js](https://github.com/panpeter/rugpullgame/blob/main/contracts/scripts/play.js) script that runs a simple playing script. It uses three accounts to pump and do rug pulls. It's very easy to beat but I won't say how 😊 The code is public so anyone with basic programming knowledge can guess its actions and win.

## Useful commands
```
// Test the contract
npx hardhat test

// Deploy the contract to the mainnet 
npx hardhat run scripts/deploy.js --network bnb_mainnet

// Verify the contract on BscScan
npx hardhat verify --network bnb_mainnet [contract_address]

// Run playing script
npx hardhat run scripts/play.js --network bnb_mainnet
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
