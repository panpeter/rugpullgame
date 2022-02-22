require('dotenv').config()
const hre = require("hardhat")
const ethers = hre.ethers

// ========== CONSTANTS ==========

const {
    POLYGON_MAINNET_API_URL,
    PLAYER_1_PRIVATE_KEY,
    PLAYER_2_PRIVATE_KEY,
    PLAYER_3_PRIVATE_KEY,
} = process.env

const PLAYER_1 = "0xb9DDF0c1594E7396A68452Db7ECF1F5A12777863"
const PLAYER_2 = "0xC92000e59F4a8d3cd35F041E3Ac75b6EE6Ab7676"
const PLAYER_3 = "0xFab7feDa9af2bE4A08451a13868ADEc75735a7F7"

const CONTRACT_ADDRESS = "0xd395F51969A9d1A91F9ee726bf25303d9FEE4c2E"
const ONE_ETH = ethers.utils.parseEther("1")

// ========== GLOBAL FIELDS ==========

const provider = new ethers.providers.JsonRpcProvider(POLYGON_MAINNET_API_URL)
const gameContract = new ethers.Contract(
    CONTRACT_ADDRESS,
    [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address payable", "name": "pumper", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "balance", "type": "uint256" }], "name": "Pump", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address payable[]", "name": "pumpers", "type": "address[]" }, { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "RugPull", "type": "event" }, { "inputs": [], "name": "PUMP_FEE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "RUG_PULL_BLOCKS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getLatestPumpers", "outputs": [{ "internalType": "address payable[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pump", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "rugPull", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }],
    provider,
)

// ========== HELPER FUNCTIONS ==========

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getWallet(address) {
    if (address == PLAYER_1) return new ethers.Wallet(PLAYER_1_PRIVATE_KEY, provider)
    if (address == PLAYER_2) return new ethers.Wallet(PLAYER_2_PRIVATE_KEY, provider)
    if (address == PLAYER_3) return new ethers.Wallet(PLAYER_3_PRIVATE_KEY, provider)

    throw `Unknown address ${address}`
}

function getRandomPumper() {
    let pumpers = [PLAYER_1, PLAYER_2, PLAYER_3]
    return pumpers[Math.floor(Math.random() * pumpers.length)]
}

async function getFasterGasPrice() {
    let gasPrice = await provider.getGasPrice()
    return gasPrice.add(gasPrice.div(7))
}

function sleepUntilBlock(block) {
    console.log(`Sleeping until block: ${block}`)
    return new Promise(async resolve => {
        while (true) {
            let currentBlock = await provider.getBlockNumber()
            console.log(`Current block ${currentBlock}`)
            if (currentBlock >= block) {
                resolve()
                break
            } else {
                await sleep(10_000)
            }
        }
    })
}

// ========== CONTRACT INTERACTIONS ==========

// True if balance is greater than 15 ETH or latest pumper has balance less than 2 ETH
async function shouldRugPull() {
    let contractBalance = await provider.getBalance(CONTRACT_ADDRESS)
    console.log(`Contract balance ${contractBalance}`)
    if (contractBalance >= (ONE_ETH * 15)) {
        return true
    }

    let latestPumpers = await gameContract.getLatestPumpers()
    if (latestPumpers.length == 0) {
        return false
    }
    let pumper = latestPumpers[0]
    let pumperBalance = await provider.getBalance(pumper)
    console.log(`Latest pumper balance ${pumperBalance}`)
    if (pumperBalance < ONE_ETH * 2) {
        return true
    }

    return false
}

async function rugPull() {
    console.log("RUG PULL")
    let latestPumpers = await gameContract.getLatestPumpers()
    console.log(latestPumpers)
    let pumper = latestPumpers[0]

    let gasPrice = await getFasterGasPrice()
    console.log(`Gas price ${gasPrice}`)

    let tx = await gameContract.connect(getWallet(pumper)).rugPull({
        gasPrice: gasPrice,
    })
    console.log("== TX ==")
    console.log(tx)

    let rc = await tx.wait()
    console.log("== RC ==")
    console.log(rc)
}

async function pump() {
    console.log("PUMP")

    let pumper = getRandomPumper()
    console.log(`Pumper ${pumper}`)

    let gasPrice = await getFasterGasPrice()
    console.log(`Gas price ${gasPrice}`)

    let tx = await gameContract.connect(getWallet(pumper)).pump({
        value: ONE_ETH,
        gasPrice: gasPrice,
    })
    console.log("== TX ==")
    console.log(tx)

    let rc = await tx.wait()
    console.log("== RC ==")
    console.log(rc)
}

async function main() {
    while (true) {
        console.log("==================================")
        let pullTheRug = await shouldRugPull()    
        if (pullTheRug) {
            let rubPullBlock = await provider.getBlockNumber() + 30
            await sleepUntilBlock(rubPullBlock)
            await rugPull()
        } else {
            // Wait between 20 and 30 blocks
            let randomBlockNumber = Math.floor(Math.random() * 30) + 20
            let pumpBlock = await provider.getBlockNumber() + randomBlockNumber
            await sleepUntilBlock(pumpBlock)
            await pump()
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
