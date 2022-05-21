import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {AppThunk} from "../../app/store";
import {chainId, web3} from "../../app/web3";

export enum ConnectionState {
    Connecting = 'connecting',
    Connected = 'connected',
    Disconnected = 'disconnected',
}

interface WalletState {
    isMetamaskMissing: boolean,
    connectionState: ConnectionState,
    address?: string
}

const initialState: WalletState = {
    isMetamaskMissing: false,
    connectionState: ConnectionState.Disconnected,
}

export const connectWallet = (): AppThunk => async (dispatch) => {
    // TODO warn window.ethereum is null
    dispatch(connecting())

    // Switch to BSC.
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{chainId: web3.utils.toHex(chainId)}],
    });

    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
    })

    dispatch(connected(accounts))
}

export const checkWallet = (): AppThunk => async (dispatch) => {
    const currentChainId = await web3.eth.net.getId()
    if (currentChainId === chainId) {
        const accounts = await window.ethereum.request({
            method: "eth_accounts",
        })
        dispatch(connected(accounts))
    } else {
        dispatch(disconnected())
    }
}

const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        accountsChanged: (state, action: PayloadAction<Array<string>>) => {
            const accounts = action.payload
            if (accounts.length > 0) {
                state.connectionState = ConnectionState.Connected
                state.address = accounts[0]
            } else {
                state.connectionState = ConnectionState.Disconnected
                delete state.address
            }
        },
        disconnected: (state) => {
            state.connectionState = ConnectionState.Disconnected
            delete state.address
            // TODO Handle error if any.
        },
        connecting: (state) => {
            state.connectionState = ConnectionState.Connecting
        },
        connected: (state, action: PayloadAction<Array<string>>) => {
            const accounts = action.payload
            if (accounts.length > 0) {
                state.connectionState = ConnectionState.Connected
                state.address = accounts[0]
            } else {
                state.connectionState = ConnectionState.Disconnected
                delete state.address
            }
        },
        missingMetamask: (state) => {
            state.isMetamaskMissing = true
        }
    },
})

export const {
    accountsChanged,
    disconnected,
    connecting,
    connected,
    missingMetamask
} = walletSlice.actions

export default walletSlice.reducer