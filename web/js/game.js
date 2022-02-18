// ========== HELPER FUNCTIONS ==========

var style = document.createElement('style');
style.innerHTML = '.hide { display: none !important; }';
document.getElementsByTagName('head')[0].appendChild(style);

const removeHide = function (elem) { if (elem.classList.contains("hide")) elem.classList.remove("hide") }
const hide = function (elem) { if (!elem.classList.contains("hide")) elem.classList.add("hide") }
const disable = function (elem) { elem.setAttribute("disabled", "disabled") }
const enable = function (elem) { elem.removeAttribute("disabled") }

// ========== CONSTANTS ==========

const contractABI = [{ anonymous: !1, inputs: [{ indexed: !0, internalType: "address", name: "previousOwner", type: "address" }, { indexed: !0, internalType: "address", name: "newOwner", type: "address" }], name: "OwnershipTransferred", type: "event" }, { anonymous: !1, inputs: [{ indexed: !1, internalType: "address payable", name: "pumper", type: "address" }, { indexed: !1, internalType: "uint256", name: "balance", type: "uint256" }], name: "Pump", type: "event" }, { anonymous: !1, inputs: [{ indexed: !1, internalType: "address payable[]", name: "pumpers", type: "address[]" }, { indexed: !1, internalType: "uint256", name: "reward", type: "uint256" }], name: "RugPull", type: "event" }, { inputs: [], name: "PUMP_FEE", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "RUG_PULL_BLOCKS", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "getLatestPumpers", outputs: [{ internalType: "address payable[]", name: "", type: "address[]" }], stateMutability: "view", type: "function" }, { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "pullTheRug", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "pump", outputs: [], stateMutability: "payable", type: "function" }, { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "address", name: "newOwner", type: "address" }], name: "transferOwnership", outputs: [], stateMutability: "nonpayable", type: "function" }]
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
// const web3 = AlchemyWeb3.createAlchemyWeb3("https://eth-ropsten.alchemyapi.io/v2/W6UzXHDjzAdfELyjMpS9t_YfTJXxbkF6")
const web3 = AlchemyWeb3.createAlchemyWeb3("ws://127.0.0.1:8545/")

// ========== HTML ELEMENTS ==========

const main = document.getElementById("main")
const gameProgressPanel = document.getElementById("game_progress_panel")
const rugPullPanel = document.getElementById("rug_pull_panel")
const singleRugPullInfo = document.getElementById("single_rug_pull_info")
const singleRugPullAddress = document.getElementById("single_rug_pull_address")
const singleRugPullReward = document.getElementById("single_rug_pull_reward")
const multiRugPullInfo = document.getElementById("multi_rug_pull_info")
const multiRugPullAddresses = document.getElementById("multi_rug_pull_addresses")
const multiRugPullReward = document.getElementById("multi_rug_pull_reward")
const timeLeftView = document.getElementById("time_left_view")
const rewardPoolView = document.getElementById("reward_pool_view")
const pendingWinnersView = document.getElementById("pending_winners_text")
const feedbackView = document.getElementById("feedback")
const connectLink = document.getElementById("connect_link")
const pumpLink = document.getElementById("pump_link")
const pullTheRugLink = document.getElementById("pull_the_rug_link")
const pullTheRugButton = document.getElementById("pull_the_rug_button")
const startOverLink = document.getElementById("start_over_link")
const pumpersTable = document.getElementById("pumpers")

// ========== STATE AND RELATED FUNCTIONS ==========

let state = {
    connected: false,
    walletAddress: null,
    pumpers: [],
    rugPulls: [],
    balance: 0,
    latestRugPullBlock: 0,
    latestPumpBlock: 0,
    latestBlock: 0,
    feedback: null,
    rugPullBlocks: 0,
    pumpFee: 0,
}

const getPendingWinners = function (state) {
    if (state.pumpers.lenght == 0) return []

    let candidates = state.pumpers.slice().reverse()
    let firstWinner = candidates[0]
    let pendingWinners = []
    for (let i = 0; i < candidates.length; i++) {
        let candidate = candidates[i]
        if (candidate.blockNumber == firstWinner.blockNumber) {
            pendingWinners.push(candidate)
        }
    }

    return pendingWinners
}

const isPendingWinner = function (state) {
    return getPendingWinners(state).map(pumper => pumper.address).indexOf(state.walletAddress) != -1
}

const isRugPull = function (state) {
    return state.latestPumpBlock < state.latestRugPullBlock
}

const getRugPullRemainingBlocks = function (state) {
    let blocksSinceLastPump = state.latestBlock - state.latestPumpBlock
    let remainingBlocks = state.rugPullBlocks - blocksSinceLastPump
    return Math.max(0, remainingBlocks)
}

const canDoRugPull = function (state) {
    return isPendingWinner(state) && getRugPullRemainingBlocks(state) == 0
}

// ========== UPDATE UI FUNCTIONS ==========

const updateUI = function (state) {
    updateConnectLink(state)
    updatePumpLink(state)
    updateRugPullLink(state)
    updateStartOverLink(state)
    updateFeedbackView(state)
    updateGameProgressPanel(state)
    updateRugPullPanel(state)
    updatePumpersTable(state)
}

const updateConnectLink = function (state) {
    if (state.connected) {
        hide(connectLink)
    } else {
        removeHide(connectLink)
    }
}

const updatePumpLink = function (state) {
    if (state.connected && !isPendingWinner(state)) {
        removeHide(pumpLink)
    } else {
        hide(pumpLink)
    }
}

const updateRugPullLink = function (state) {
    if (state.connected && isPendingWinner(state) && !isRugPull(state)) {
        removeHide(pullTheRugLink)
        if (canDoRugPull(state)) {
            enable(pullTheRugButton)
        } else {
            disable(pullTheRugButton)
        }
    } else {
        hide(pullTheRugLink)
    }
}

const updateStartOverLink = function (state) {
    if (isRugPull(state)) {
        removeHide(startOverLink)
    } else {
        hide(startOverLink)
    }
}

const updateFeedbackView = function (state) {
    if (state.feedback != null) {
        feedbackView.innerText = state.feedback
        removeHide(feedbackView)
    } else {
        hide(feedbackView)
    }
}

const updateGameProgressPanel = function (state) {
    if (isRugPull(state)) {
        hide(gameProgressPanel)
        return
    }
    removeHide(gameProgressPanel)

    pendingWinnersView.textContent = buildPendingWinnersText(state)
    timeLeftView.textContent = getRugPullRemainingBlocks(state)
    rewardPoolView.textContent = web3.utils.fromWei(state.balance.toString()) + " MATIC"
}

const updateRugPullPanel = function (state) {
    if (!isRugPull(state)) {
        hide(rugPullPanel)
        return
    }

    removeHide(rugPullPanel)

    let rugPull = state.rugPulls[state.rugPulls.length - 1]

    if (rugPull.pumpers.length == 1) {
        hide(multiRugPullInfo)
        removeHide(singleRugPullInfo)

        singleRugPullAddress.innerText = parseAddress(rugPull.pumpers[0])
        singleRugPullReward.innerText = web3.utils.fromWei(rugPull.reward.toString())
    } else {
        hide(singleRugPullInfo)
        removeHide(multiRugPullInfo)

        multiRugPullAddresses.innerText = rugPull.pumpers.map(pumper => parseAddress(pumper)).join(" and ")
        multiRugPullReward.innerText = web3.utils.fromWei(rugPull.reward.toString())
    }
}

const updatePumpersTable = function (state) {
    let pumpers = state.pumpers.slice().reverse().filter(pumper => pumper.blockNumber >= state.latestRugPullBlock)
    pumpersTable.innerHTML = pumpers.map(pumper => buildPumperHtml(pumper)).join("")
}

// ========== HTML BUILDER FUNCTIONS ==========

const buildPendingWinnersText = function (state) {
    return getPendingWinners(state).map(pumper => parseAddress(pumper.address)).join(" and ")
}

const buildPumperHtml = function (pumper) {
    let html = "<tr>"

    html += "<td>"
    html += pumper.blockNumber
    html += "</td>"

    // TODO Link to ethscanner
    html += "<td>"
    html += parseAddress(pumper.address)
    html += "</td>"

    html += "<td>"
    html += web3.utils.fromWei(pumper.balance.toString()) + " MATIC"
    html += "</td>"

    html += "</tr>"

    return html
}

const parseAddress = function (address) {
    if (address == state.walletAddress) return "you"

    return address.substring(0, 6) + "…" + address.substring(38)
}

// ========== WEB3 EVENTS ==========

const handleConnectedEvent = function (walletAddress) {
    state.connected = true
    state.walletAddress = walletAddress.toLowerCase()
    state.feedback = null
    updateUI(state)
}

const handleConnectionErrorEvent = function (error) {
    state.connected = false
    state.walletAddress = null
    state.feedback = error
    updateUI(state)
}

const handleDisconnectedEvent = function () {
    state.connected = false
    state.walletAddress = null
    state.feedback = null
    updateUI(state)
}

const handlePumpSuccessEvent = function (txHash) {
    // TODO fix url and update the UI
    // state.feedback = "Pumped! Check out your transaction on Etherscan: https://ropsten.etherscan.io/tx/" + txHash
    updateUI(state)
}

const handlePumpErrorEvent = function (error) {
    state.feedback = error
    updateUI(state)
}

const handlePumpSubscriptionErrorEvent = function (error) {
    state.feedback = error
    updateUI(state)
}

const handlePumpEventDataEvent = function (event) {
    state.balance = event.returnValues.balance
    state.latestPumpBlock = Math.max(event.blockNumber, state.latestPumpBlock)

    state.pumpers.push({
        blockNumber: event.blockNumber,
        address: event.returnValues.pumper.toLowerCase(),
        balance: event.returnValues.balance,
    })

    updateUI(state)
}

const handlePumpEventChangedEvent = function (event) {
    state.balance = event.returnValues.balance
    state.latestPumpBlock = Math.max(event.blockNumber, state.latestPumpBlock)

    state.pumpers.push({
        blockNumber: event.blockNumber,
        address: event.returnValues.pumper.toLowerCase(),
        balance: event.returnValues.balance,
    })

    updateUI(state)
}

const handleRugPullSubscriptionErrorEvent = function (error) {
    state.feedback = error
    updateUI(state)
}

const handleRugPullEventDataEvent = function (event) {
    state.latestRugPullBlock = Math.max(event.blockNumber, state.latestRugPullBlock)

    state.rugPulls.push({
        blockNumber: event.blockNumber,
        pumpers: event.returnValues.pumpers.map(address => address.toLowerCase()),
        reward: event.returnValues.reward,
    })

    updateUI(state)
}

const handleRugPullEventChangedEvent = function (event) {
    state.latestRugPullBlock = Math.max(event.blockNumber, state.latestRugPullBlock)

    state.rugPulls.push({
        blockNumber: event.blockNumber,
        pumpers: event.returnValues.pumpers.map(address => address.toLowerCase()),
        reward: event.returnValues.reward,
    })

    updateUI(state)
}

const handleBlockFetchedEvent = function (block) {
    state.latestBlock = block

    updateUI(state)
}

const handleNewBlockEvent = function (event) {
    if (event.transactions.lenght == 0) return

    state.latestBlock = event.number

    updateUI(state)
}

const handleBlockHeaderErrorEvent = function (error) {
    state.feedback = error

    updateUI(state)
}

const onRugPullBlocksFetchedEvent = function (blocks) {
    state.rugPullBlocks = blocks

    updateUI(state)
}

const onPumpFeeFetchedEvent = function (fee) {
    state.pumpFee = fee

    updateUI(state)
}

const handleRugPullEvent = function (txHash) {
    state.feedback = "Rug Pull! Check out your transaction on Etherscan: https://ropsten.etherscan.io/tx/" + txHash
    updateUI(state)
}

const handleRugPullErrorEvent = function (error) {
    state.feedback = error

    updateUI(state)
}

// ========== UI TRIGGERED ACTIONS ==========

const connectWallet = async function () {
    if (window.ethereum) {
        try {
            await window.ethereum.request({
                method: "eth_requestAccounts",
            });
        } catch (error) {
            handleConnectionErrorEvent(error.message)
        }
    } else {
        handleConnectionErrorEvent("You must install Metamask browser extension first.")
    }
}

const pump = async function () {
    let userAddress = window.ethereum.selectedAddress
    let value = web3.utils.toHex(web3.utils.toWei('1', 'ether'))

    const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        value: value,
        data: window.contract.methods.pump().encodeABI()
    }

    try {
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        handlePumpSuccessEvent(txHash)
    } catch (error) {
        handlePumpErrorEvent(error.message)
    }
}

const rugPull = async function () {
    let userAddress = window.ethereum.selectedAddress

    const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        data: window.contract.methods.pullTheRug().encodeABI()
    }

    try {
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        handleRugPullEvent(txHash)
    } catch (error) {
        handleRugPullErrorEvent(error.message)
    }
}

const checkConnection = async function () {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_accounts",
            })
            if (addressArray.length > 0) {
                handleConnectedEvent(addressArray[0])
            } else {
                handleDisconnectedEvent()
            }
        } catch (err) {
            handleDisconnectedEvent()
        }
    }
}

// ========== SETUP ==========

const setup = async function () {
    hide(gameProgressPanel)
    hide(rugPullPanel)
    hide(pumpLink)
    hide(pullTheRugLink)
    hide(startOverLink)
    hide(feedbackView)
    removeHide(connectLink)

    connectLink.onclick = function () { connectWallet() }
    pumpLink.onclick = function () { pump() }
    pullTheRugLink.onclick = function () { rugPull() }
    startOverLink.onclick = function () { pump() }

    window.ethereum.on('accountsChanged', async () => { checkConnection() })
    window.contract = await new web3.eth.Contract(contractABI, contractAddress)

    window.contract.methods.RUG_PULL_BLOCKS().call().then((blocks) => {
        onRugPullBlocksFetchedEvent(blocks)
    })

    window.contract.methods.PUMP_FEE().call().then((fee) => {
        onPumpFeeFetchedEvent(fee)
    })

    web3.eth.getBlockNumber().then(handleBlockFetchedEvent)

    web3.eth.subscribe("newBlockHeaders", async (error, event) => {
        if (!error) {
            handleNewBlockEvent(event)
        } else {
            handleBlockHeaderErrorEvent(error.message)
        }
    })

    // TODO: filter to latest 100?
    let options = {
        filter: {
            value: [],
        },
        fromBlock: 0
    }

    window.contract.events.Pump(options)
        .on('data', event => handlePumpEventDataEvent(event))
        .on('changed', event => handlePumpEventChangedEvent(event))
        .on('error', err => handlePumpSubscriptionErrorEvent(err))

    window.contract.events.RugPull(options)
        .on('data', event => handleRugPullEventDataEvent(event))
        .on('changed', event => handleRugPullEventChangedEvent(event))
        .on('error', err => handleRugPullSubscriptionErrorEvent(err))

    checkConnection()

    main.style.display = ""
}

setup()
