// Helper functions

const show = function (elem) { elem.style.display = 'block' }
const hide = function (elem) { elem.style.display = 'none' }
const disable = function (elem) { elem.setAttribute("disabled", "disabled") }
const enable = function (elem) { elem.removeAttribute("disabled") }

// Constants
const contractABI = [{ anonymous: !1, inputs: [{ indexed: !0, internalType: "address", name: "previousOwner", type: "address" }, { indexed: !0, internalType: "address", name: "newOwner", type: "address" }], name: "OwnershipTransferred", type: "event" }, { anonymous: !1, inputs: [{ indexed: !1, internalType: "address payable[]", name: "bidders", type: "address[]" }, { indexed: !1, internalType: "uint256", name: "balance", type: "uint256" }], name: "Pump", type: "event" }, { anonymous: !1, inputs: [{ indexed: !1, internalType: "address payable[]", name: "bidders", type: "address[]" }, { indexed: !1, internalType: "uint256", name: "reward", type: "uint256" }], name: "RugPull", type: "event" }, { inputs: [], name: "PUMP_FEE", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "RUG_PULL_BLOCKS", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }, { inputs: [], name: "getLastPumpers", outputs: [{ internalType: "address payable[]", name: "", type: "address[]" }], stateMutability: "view", type: "function" }, { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" }, { inputs: [], name: "pullTheRug", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [], name: "pump", outputs: [], stateMutability: "payable", type: "function" }, { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" }, { inputs: [{ internalType: "address", name: "newOwner", type: "address" }], name: "transferOwnership", outputs: [], stateMutability: "nonpayable", type: "function" }];
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
// const web3 = AlchemyWeb3.createAlchemyWeb3("https://eth-ropsten.alchemyapi.io/v2/W6UzXHDjzAdfELyjMpS9t_YfTJXxbkF6")
const web3 = AlchemyWeb3.createAlchemyWeb3("http://127.0.0.1:8545/")

// HTML elements

const main = document.getElementById("main")
const timeLeftView = document.getElementById("time_left_view")
const pendingWinnersView = document.getElementById("pending_winners_view")
const feedbackView = document.getElementById("feedback")
const connectLink = document.getElementById("connect_link")
const pumpLink = document.getElementById("pump_link")
const pullTheRugLink = document.getElementById("pull_the_rug_link")
const pullTheRugButton = document.getElementById("pull_the_rug_button")

// State

let state = {
    connected: false,
    walletAddress: null,
    feedback: null,
}

const updateUI = function (state) {
    if (state.connected) hide(connectLink); else show(connectLink)
    if (state.connected) show(pumpLink); else hide(pumpLink)

    if (state.feedback != null) {
        feedbackView.innerText = state.feedback
        show(feedbackView)
    } else {
        hide(feedbackView)
    }
}

// Internal events

const handleConnectedEvent = function (walletAddress) {
    state.connected = true
    state.walletAddress = walletAddress
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
    state.feedback = "Pumped! Check out your transaction on Etherscan: https://ropsten.etherscan.io/tx/" + txHash
    updateUI(state)
}

const handlePumpErrorEvent = function (error) {
    state.feedback = error
    updateUI(state)
}

// UI triggered actions

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
    window.contract = await new web3.eth.Contract(contractABI, contractAddress)
    let userAddress = window.ethereum.selectedAddress
    let value = web3.utils.toHex(web3.utils.toWei('1', 'ether'))

    const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        value: value,
        'data': window.contract.methods.pump().encodeABI()
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

// Setup

const setup = async function () {
    hide(pumpLink)
    hide(pullTheRugLink)
    hide(feedbackView)
    show(connectLink)

    connectLink.onclick = function () { connectWallet() }
    pumpLink.onclick = function () { pump() }

    window.ethereum.on('accountsChanged', async () => { checkConnection() })

    checkConnection()

    show(main)
}

setup()
