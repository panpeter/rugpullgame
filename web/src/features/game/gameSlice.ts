import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from "../../app/store";
import {EventData} from "web3-eth-contract";
import {contracts, isSameAddress, web3} from "../../app/web3";
import {BlockHeader} from "web3-eth";

export enum GameCondition {
    NotLoaded = 'not loaded',
    Loading = 'loading',
    NotStarted = 'not started', // startBlock has not been reached yet
    Initiated = 'initiated', // startBlock has been reached but nobody has pumped yet
    Pumping = 'pumping',
    RugPull = 'rug pull',
}

export interface GameAction {
    sender: string,
    block: number,
    balance: string,
    rugPull: boolean,
}

interface GameState {
    condition: GameCondition,
    contractAddress: string
    rewardPool: string,
    pumpFee: string,
    rugPullBlocks: number,
    feedback?: string,
    pumps: GameAction[]
    // Before game starts
    startBlock: number,
    currentBlock: number,
    startTimeMs: number,
    // Game active
    rugPullBlocksLeft?: number,
    pendingWinner?: string
    // Rug pull
    rugPull?: GameAction,
}

const initialState: GameState = {
    condition: GameCondition.NotLoaded,
    contractAddress: "",
    rewardPool: "0",
    pumpFee: "0",
    rugPullBlocks: 0,
    feedback: undefined,
    pumps: [],
    startBlock: 0,
    currentBlock: 0,
    startTimeMs: 0,
    rugPullBlocksLeft: undefined,
    pendingWinner: undefined,
    rugPull: undefined,
}

export const load = (
    contractAddress: string,
): AppThunk => async (dispatch) => {
    dispatch(loadStarted(contractAddress))

    const contract = contracts.get(contractAddress)!
    const actions: GameAction[] = await contract.methods.getActions().call()
    const pumpFee = await contract.methods.PUMP_FEE().call()
    const rewardPool = await web3.eth.getBalance(contractAddress)
    const rugPullBlocks = await contract.methods.RUG_PULL_BLOCKS().call()
    const startBlock = await contract.methods.START_BLOCK().call()
    const currentBlock = await web3.eth.getBlockNumber()

    dispatch(loadFinished({
        actions: actions,
        pumpFee: pumpFee,
        rewardPool: rewardPool,
        rugPullBlocks: rugPullBlocks,
        startBlock: startBlock,
        currentBlock: currentBlock,
    }))
}

export const pump = (): AppThunk => async (dispatch, getState) => {
    const userAddress = getState().wallet.address
    const contractAddress = getState().game.contractAddress
    const pumpFee = getState().game.pumpFee
    const contract = contracts.get(contractAddress)!
    const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        value: web3.utils.toHex(pumpFee),
        data: contract.methods.pump().encodeABI(),
    }

    try {
        await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        // UI is updated when the event arrives.
    } catch (error) {
        // @ts-ignore
        dispatch(actionErrorOccurred(error.message))
    }
}

export const rugPull = (): AppThunk => async (dispatch, getState) => {
    const userAddress = getState().wallet.address
    const contractAddress = getState().game.contractAddress
    const contract = contracts.get(contractAddress)!
    const transactionParameters = {
        to: contractAddress,
        from: userAddress,
        data: contract.methods.rugPull().encodeABI(),
    }
    try {
        await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        // UI is updated when the event arrives.
    } catch (error) {
        // @ts-ignore
        dispatch(actionErrorOccurred(error.message))
    }
}

export const handlePumpEvent = (
    event: EventData
): AppThunk => async (dispatch, getState) => {
    if (!isSameAddress(getState().game.contractAddress, event.address)) {
        return
    }

    dispatch(newActionReceived({
        sender: event.returnValues.sender.toLowerCase(),
        block: event.blockNumber,
        balance: event.returnValues.balance,
        rugPull: false,
    }))
}

export const handleRugPullEvent = (
    event: EventData
): AppThunk => async (dispatch, getState) => {
    if (!isSameAddress(getState().game.contractAddress, event.address)) {
        return
    }

    dispatch(newActionReceived({
        sender: event.returnValues.sender.toLowerCase(),
        block: event.blockNumber,
        balance: event.returnValues.reward,
        rugPull: true,
    }))
}

export const handleNewBlockEvent = (
    blockHeader: BlockHeader
): AppThunk => async (dispatch) => {
    if (blockHeader.gasLimit === 0) return

    dispatch(newBlockReceived(blockHeader.number))
}

interface LoadFinishedActionPayload {
    actions: Array<GameAction>,
    pumpFee: string,
    rewardPool: string,
    rugPullBlocks: number,
    startBlock: number,
    currentBlock: number,
}

export const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        loadStarted: (state, action: PayloadAction<string>) => {
            state.contractAddress = action.payload
            state.condition = GameCondition.Loading
        },
        loadFinished: (state, action: PayloadAction<LoadFinishedActionPayload>) => {
            const payload = action.payload

            state.rewardPool = payload.rewardPool
            state.pumps = payload.actions.filter(action => !action.rugPull)
            state.pumpFee = payload.pumpFee
            state.rugPullBlocks = payload.rugPullBlocks

            state.startBlock = payload.startBlock
            state.currentBlock = payload.currentBlock
            const remainingBlocks = payload.startBlock - payload.currentBlock
            const avgBlockTimeInSeconds = 3.02
            const gameStartsInSeconds = remainingBlocks * avgBlockTimeInSeconds
            const startTime = new Date()
            startTime.setSeconds(startTime.getSeconds() + gameStartsInSeconds)
            state.startTimeMs = startTime.getTime()

            if (gameStartsInSeconds > 0) {
                state.condition = GameCondition.NotStarted
                return
            }

            const lastAction = payload.actions.at(-1)!

            if (!lastAction) {
                state.condition = GameCondition.Initiated
                return
            }

            if (lastAction.rugPull) {
                state.condition = GameCondition.RugPull
                state.rugPull = lastAction
            } else {
                state.condition = GameCondition.Pumping
                state.rugPullBlocksLeft = countRugPullBlocksLeft(
                    state.currentBlock,
                    lastAction.block,
                    state.rugPullBlocks,
                )
                state.pendingWinner = lastAction.sender
            }
        },
        unload: (state) => {
            state.contractAddress = ""
            state.condition = GameCondition.NotLoaded
        },
        newActionReceived: (state, action: PayloadAction<GameAction>) => {
            const gameAction = action.payload
            if (gameAction.rugPull) {
                state.condition = GameCondition.RugPull
                state.rewardPool = gameAction.balance
                state.rugPull = gameAction
            } else {
                state.condition = GameCondition.Pumping
                state.rugPullBlocksLeft = countRugPullBlocksLeft(
                    state.currentBlock,
                    gameAction.block,
                    state.rugPullBlocks,
                )
                state.rewardPool = gameAction.balance
                state.pendingWinner = gameAction.sender
                state.pumps.push(gameAction)
            }
        },
        newBlockReceived: (state, action: PayloadAction<number>) => {
            state.currentBlock = action.payload
            if (state.condition === GameCondition.NotStarted && state.currentBlock >= state.startBlock) {
                state.condition = GameCondition.Initiated
                return
            }

            if (state.condition === GameCondition.Pumping) {
                const lastPump = state.pumps.at(-1)
                if (lastPump) {
                    state.rugPullBlocksLeft = countRugPullBlocksLeft(
                        state.currentBlock,
                        lastPump.block,
                        state.rugPullBlocks
                    )
                }
            }
        },
        actionErrorOccurred: (state, action: PayloadAction<string>) => {
            state.feedback = action.payload
        },
        dismissFeedback: (state) => {
            state.feedback = undefined
        }
    },
});

const countRugPullBlocksLeft = (
    currentBlock: number,
    lastActionBlock: number,
    rugPullBlocks: number
) => {
    const rugPullBlocksLeft = Number(lastActionBlock) + Number(rugPullBlocks) - Number(currentBlock)
    return Math.max(0, rugPullBlocksLeft)
}

const {
    loadStarted,
    loadFinished,
    newActionReceived,
    newBlockReceived,
    actionErrorOccurred,
} = gameSlice.actions

export const {
    unload,
    dismissFeedback,
} = gameSlice.actions

export default gameSlice.reducer;
