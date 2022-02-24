// ========== HELPER FUNCTIONS ==========

var style = document.createElement('style');
style.innerHTML = '.hide { display: none !important; }';
document.getElementsByTagName('head')[0].appendChild(style);

const removeHide = function (elem) { elem.classList.remove("hide") }
const hide = function (elem) { elem.classList.add("hide") }
const disable = function (elem) { elem.setAttribute("disabled", "disabled") }
const enable = function (elem) { elem.removeAttribute("disabled") }

const debounce = (context, func, delay) => {
    let timeout
    return (...arguments) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => { func.apply(context, arguments) }, delay)
    }
}

// ========== CONSTANTS ==========

const contractABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address payable", "name": "pumper", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "balance", "type": "uint256" }], "name": "Pump", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address payable[]", "name": "pumpers", "type": "address[]" }, { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "RugPull", "type": "event" }, { "inputs": [], "name": "PUMP_FEE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "RUG_PULL_BLOCKS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getLatestPumpers", "outputs": [{ "internalType": "address payable[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pump", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "rugPull", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]
const contractAddress = "0xd395F51969A9d1A91F9ee726bf25303d9FEE4c2E"
const web3 = AlchemyWeb3.createAlchemyWeb3("wss://polygon-mainnet.g.alchemy.com/v2/OoPc8KfqoohY9r8h_jEQKizXneEUm5vX")
const addressLinkPrefix = "https://polygonscan.com/address/"

// ========== HTML ELEMENTS ==========

const main = document.getElementById("main")
const loadingInfo = document.getElementById("loading_info")
const metamaskError = document.getElementById("metamask_error")
const gameProgressPanel = document.getElementById("game_progress_panel")
const rugPullPanel = document.getElementById("rug_pull_panel")
const userRugPullInfo = document.getElementById("user_rug_pull_info")
const userRugPullAddress = document.getElementById("user_rug_pull_address")
const userRugPullReward = document.getElementById("user_rug_pull_reward")
const singleRugPullInfo = document.getElementById("single_rug_pull_info")
const singleRugPullAddress = document.getElementById("single_rug_pull_address")
const singleRugPullReward = document.getElementById("single_rug_pull_reward")
const multiRugPullInfo = document.getElementById("multi_rug_pull_info")
const multiRugPullAddresses = document.getElementById("multi_rug_pull_addresses")
const multiRugPullReward = document.getElementById("multi_rug_pull_reward")
const timeLeftView = document.getElementById("time_left_view")
const rewardPoolView = document.getElementById("reward_pool_view")
const pendingWinnersView = document.getElementById("pending_winners_text")
const feedbackContainer = document.getElementById("feedback_container")
const feedbackText = document.getElementById("feedback")
const feedbackDismissLink = document.getElementById("feedback_dismiss_link")
const connectLink = document.getElementById("connect_link")
const pumpLink = document.getElementById("pump_link")
const rugPullLink = document.getElementById("rug_pull_link")
const rugPullButton = document.getElementById("rug_pull_button")
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
    if (state.pumpers.length == 0) return []

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

const getPreviousRugPull = function (state) {
    let rugPulls = state.rugPulls
    if (rugPulls.length < 2) {
        return null
    }

    return rugPulls[rugPulls.length - 2]
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
    if (state.latestBlock == 0) return
    if (state.rugPullBlocks == 0) return
    if (state.pumpFee == 0) return

    debouncedUpdateUINow(state)
}

const debouncedUpdateUINow = debounce(this, state => updateUiNow(state), 100)

const updateUiNow = function (state) {
    main.style.display = ""
    hide(loadingInfo)

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
    if (state.connected && !isPendingWinner(state) && !isRugPull(state)) {
        removeHide(pumpLink)
    } else {
        hide(pumpLink)
    }
}

const updateRugPullLink = function (state) {
    if (state.connected && isPendingWinner(state) && !isRugPull(state)) {
        removeHide(rugPullLink)
        if (canDoRugPull(state)) {
            enable(rugPullButton)
        } else {
            disable(rugPullButton)
        }
    } else {
        hide(rugPullLink)
    }
}

const updateStartOverLink = function (state) {
    if (state.connected && isRugPull(state)) {
        removeHide(startOverLink)
    } else {
        hide(startOverLink)
    }
}

const updateFeedbackView = function (state) {
    if (state.feedback == null) {
        hide(feedbackContainer)
        return
    }

    removeHide(feedbackContainer)

    feedbackText.innerText = state.feedback
}

const updateGameProgressPanel = function (state) {
    if (isRugPull(state)) {
        hide(gameProgressPanel)
        return
    }
    removeHide(gameProgressPanel)

    pendingWinnersView.innerHTML = buildPendingWinnersHTML(state)
    timeLeftView.textContent = getRugPullRemainingBlocks(state)
    rewardPoolView.textContent = web3.utils.fromWei(state.balance.toString()) + " MATIC"
}

const updateRugPullPanel = function (state) {
    if (!isRugPull(state)) {
        hide(rugPullPanel)
        return
    }

    removeHide(rugPullPanel)

    updateUserRugPullInfo(state)
    updateSingleRugPullInfo(state)
    updateMultiRugPullInfo(state)
}

const updateUserRugPullInfo = function (state) {
    let rugPull = state.rugPulls[state.rugPulls.length - 1]
    if (rugPull.pumpers.length != 1 || rugPull.pumpers[0] != state.walletAddress) {
        hide(userRugPullInfo)
        return
    }

    removeHide(userRugPullInfo)

    userRugPullAddress.innerHTML = parseAddress(rugPull.pumpers[0])
    userRugPullReward.innerText = web3.utils.fromWei(rugPull.reward.toString())
}

const updateSingleRugPullInfo = function (state) {
    let rugPull = state.rugPulls[state.rugPulls.length - 1]
    if (rugPull.pumpers.length != 1 || rugPull.pumpers[0] == state.walletAddress) {
        hide(singleRugPullInfo)
        return
    }

    removeHide(singleRugPullInfo)

    singleRugPullAddress.innerHTML = parseAddress(rugPull.pumpers[0])
    singleRugPullReward.innerText = web3.utils.fromWei(rugPull.reward.toString())
}

const updateMultiRugPullInfo = function (state) {
    let rugPull = state.rugPulls[state.rugPulls.length - 1]
    if (rugPull.pumpers.length < 2) {
        hide(multiRugPullInfo)
        return
    }

    removeHide(multiRugPullInfo)

    multiRugPullAddresses.innerHTML = rugPull.pumpers.map(pumper => parseAddress(pumper)).join(" and ")
    multiRugPullReward.innerText = web3.utils.fromWei(rugPull.reward.toString())
}

const updatePumpersTable = function (state) {
    let blockNumberLimit
    if (isRugPull(state)) {
        let previousRugPull = getPreviousRugPull(state)
        if (previousRugPull) {
            blockNumberLimit = previousRugPull.blockNumber
        } else {
            blockNumberLimit = 0
        }
    } else {
        blockNumberLimit = state.latestRugPullBlock
    }

    let pumpers = state.pumpers.slice().reverse().filter(pumper => pumper.blockNumber >= blockNumberLimit)
    pumpersTable.innerHTML = pumpers.map(pumper => buildPumperHtml(pumper)).join("")
}

// ========== HTML BUILDER FUNCTIONS ==========

const buildPendingWinnersHTML = function (state) {
    return getPendingWinners(state).map(pumper => parseAddress(pumper.address)).join(" and ")
}

const buildPumperHtml = function (pumper) {
    let html = "<tr>"

    html += "<td>"
    html += pumper.blockNumber
    html += "</td>"

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
    let link = addressLinkPrefix + address
    let shortAddress
    if (address == state.walletAddress) {
        shortAddress = "you"
    } else {
        shortAddress = address.substring(0, 6) + "…" + address.substring(38)
    }

    return '<a href="' + link + '" target="_blank">' + shortAddress + '</a>'
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

const handlePumpErrorEvent = function (error) {
    state.feedback = error
    updateUI(state)
}

const handlePumpSubscriptionErrorEvent = function (error) {
    state.feedback = error.message
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

const handleRugPullSubscriptionErrorEvent = function (error) {
    state.feedback = error.message
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

const handleBlockFetchedEvent = function (block) {
    state.latestBlock = block

    updateUI(state)
}

const handleNewBlockEvent = function (event) {
    if (event.gasUsed == 0) return

    state.latestBlock = event.number

    updateUI(state)
}

const handleBlockHeaderErrorEvent = function (error) {
    state.feedback = error.message

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
        await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        // UI is updated when the event arrives.
    } catch (error) {
        handlePumpErrorEvent(error.message)
    }
}

const rugPull = async function () {
    let userAddress = window.ethereum.selectedAddress

    const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        data: window.contract.methods.rugPull().encodeABI()
    }

    try {
        await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        // UI is updated when the event arrives.
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

const dismissFeedback = function () {
    state.feedback = null
    updateUI(state)
}

// ========== SETUP ==========

const setup = async function () {
    if (!window.ethereum) {
        hide(loadingInfo)
        metamaskError.style.display = "block"
        return
    }

    hide(gameProgressPanel)
    hide(rugPullPanel)
    hide(pumpLink)
    hide(rugPullLink)
    hide(startOverLink)
    hide(feedbackContainer)
    removeHide(connectLink)

    connectLink.onclick = function () { connectWallet() }
    pumpLink.onclick = function () { pump() }
    rugPullLink.onclick = function () { rugPull() }
    startOverLink.onclick = function () { pump() }
    feedbackDismissLink.onclick = function (e) { e.preventDefault(); dismissFeedback() }

    window.ethereum.on('accountsChanged', async () => { checkConnection() })
    window.contract = await new web3.eth.Contract(contractABI, contractAddress)

    window.contract.methods.RUG_PULL_BLOCKS().call().then((blocks) => {
        onRugPullBlocksFetchedEvent(blocks)
    })

    window.contract.methods.PUMP_FEE().call().then((fee) => {
        onPumpFeeFetchedEvent(fee)
    })

    web3.eth.getBlockNumber().then(handleBlockFetchedEvent)

    web3.eth.subscribe("newBlockHeaders")
        .on('data', event => handleNewBlockEvent(event))
        .on('error', error => handleBlockHeaderErrorEvent(error))

    let currentBlock = await web3.eth.getBlockNumber()

    let options = { fromBlock: currentBlock - 2000 }

    window.contract.events.Pump(options)
        .on('data', event => handlePumpEventDataEvent(event))
        .on('error', error => handlePumpSubscriptionErrorEvent(error))

    window.contract.events.RugPull(options)
        .on('data', event => handleRugPullEventDataEvent(event))
        .on('error', error => handleRugPullSubscriptionErrorEvent(error))

    checkConnection()
}

setup()
