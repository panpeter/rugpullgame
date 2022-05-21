import React, {useEffect} from 'react';
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import styles from "./Game.module.css";
import {GameAction, GameCondition, load, pump, rugPull, unload} from "./gameSlice";
import {checkWallet, ConnectionState, connectWallet} from "../wallet/walletSlice";
import {contracts, formatEthAmount, isSameAddress, truncateAddress, web3} from "../../app/web3";
import Countdown from "react-countdown";

interface GameProps {
    contractAddress: string,
}

export function Game(props: GameProps) {
    const dispatch = useAppDispatch();

    const gameCondition = useAppSelector(state => state.game.condition)
    const contractAddress = useAppSelector(state => state.game.contractAddress)
    const isMetamaskMissing = useAppSelector(state => state.wallet.isMetamaskMissing)
    const connectionState = useAppSelector(state => state.wallet.connectionState)

    useEffect(() => {
        if (connectionState === ConnectionState.Disconnected) {
            dispatch(checkWallet())
        }
    }, [connectionState, dispatch])

    useEffect(() => {
        if (gameCondition === GameCondition.NotLoaded || !isSameAddress(props.contractAddress, contractAddress)) {
            dispatch(load(props.contractAddress))
        }
    }, [gameCondition, contractAddress, dispatch])

    if (isMetamaskMissing) {
        return <MetamaskMissing/>
    } else if (gameCondition == GameCondition.NotStarted) {
        return <CountdownPanel/>
    } else if (gameCondition == GameCondition.Initiated) {
        return <GameStarted/>
    } else if (gameCondition == GameCondition.Pumping) {
        return <GamePumping/>
    } else if (gameCondition == GameCondition.RugPull) {
        return <GameRugPull/>
    }

    return <Loading/>
}

function MetamaskMissing() {
    return <h3 className={styles.metamask_error}>
        To play you need to install <a href="https://metamask.io/">MataMask</a> extension.
    </h3>
}

function Loading() {
    return <h3 className={styles.loading}>Loading...</h3>
}

function CountdownPanel() {
    const startTime = useAppSelector(state => state.game.startTimeMs)
    const startBlock = useAppSelector(state => state.game.startBlock)
    const currentBlock = useAppSelector(state => state.game.currentBlock)
    const rewardPool = useAppSelector(state => state.game.rewardPool)

    return (
        <div className={styles.game}>
            <div className={`panel ${styles.game_progress_container}`}>
                <p>
                    Game starts on block {startBlock},
                    {' '}
                    current block is <BlockLink block={currentBlock}/>.
                </p>
                <h1><Countdown date={new Date(startTime)} daysInHours={true}/></h1>
                <p>Initial reward pool is <b>{formatEthAmount(rewardPool)} BNB</b> 😱</p>
            </div>
        </div>
    )
}

function GameStarted() {
    const rewardPool = useAppSelector(state => state.game.rewardPool)
    const isWalletConnected = useAppSelector(state => state.wallet.connectionState === ConnectionState.Connected)
    const feedback = useAppSelector(state => state.game.feedback)

    const button = isWalletConnected ? <PumpButton/> : <ConnectButton/>
    const feedbackView = feedback ? <Feedback feedback={feedback}/> : null

    return (
        <div className={styles.game}>
            <div className={`panel ${styles.game_progress_container}`}>
                <p>Connect your wallet, pump and win</p>
                <h1>{formatEthAmount(rewardPool)} BNB</h1>
                <p>Be the first!</p>
            </div>
            {feedbackView}
            <div className={styles.button_container}>
                {button}
            </div>
        </div>
    )
}

function GamePumping() {
    const feedback = useAppSelector(state => state.game.feedback)
    const pumps = useAppSelector(state => state.game.pumps)
    const isWalletConnected = useAppSelector(state => state.wallet.connectionState === ConnectionState.Connected)
    const isUserLatestPumper = useAppSelector(state => isSameAddress(state.wallet.address, state.game.pendingWinner))
    const canUserRugPull = useAppSelector(state =>
        state.game.rugPullBlocksLeft == 0 && isSameAddress(state.wallet.address, state.game.pendingWinner)
    )
    const userAddress = useAppSelector(state => state.wallet.address)
    const rewardPool = useAppSelector(state => state.game.rewardPool)
    const rugPullBlocksLeft = useAppSelector(state => state.game.rugPullBlocksLeft)
    const pendingWinner = useAppSelector(state => state.game.pendingWinner)

    const feedbackView = feedback ? <Feedback feedback={feedback}/> : null

    let button
    if (!isWalletConnected) {
        button = <ConnectButton/>
    } else if (canUserRugPull) {
        button = <RugPullButton enabled={true}/>
    } else if (isUserLatestPumper) {
        button = <RugPullButton enabled={false}/>
    } else {
        button = <PumpButton/>
    }

    return (
        <div className={styles.game}>
            <GameProgress
                pendingWinner={pendingWinner!}
                blocksLeft={rugPullBlocksLeft!}
                rewardPool={rewardPool}
                userAddress={userAddress}
            />
            {feedbackView}
            <div className={styles.button_container}>
                {button}
            </div>
            <Pumps actions={pumps} userAddress={userAddress}/>
        </div>
    )
}

function GameRugPull() {
    const currentRugPull = useAppSelector(state => state.game.rugPull)
    const userAddress = useAppSelector(state => state.wallet.address)
    const pumps = useAppSelector(state => state.game.pumps)

    return (
        <div className={styles.game}>
            <RugPullPanel action={currentRugPull!} userAddress={userAddress}/>
            <Pumps actions={pumps} userAddress={userAddress}/>
        </div>
    )
}

interface GameProgressProps {
    blocksLeft: number,
    rewardPool: string,
    userAddress?: string,
    pendingWinner: string,
}

function GameProgress(props: GameProgressProps) {
    return <div className={`panel ${styles.game_progress_container}`}>
        <p className="info" id="pending_winners_text">
            If nobody pumps
            {' '}
            <code><Address address={props.pendingWinner} userAddress={props.userAddress}/></code>
            {' '}
            can do a rug pull
        </p>
        <div className={styles.game_state}>
            <div>
                <p className="header">REMAINING BLOCKS</p>
                <h2 className={styles.state}>
                    {props.blocksLeft.toString()}
                </h2>
            </div>
            <div>
                <p className="header">REWARD POOL</p>
                <h2 className={styles.state}>
                    {formatEthAmount(props.rewardPool)}
                    {' '}
                    BNB
                </h2>
            </div>
        </div>
    </div>
}

interface RugPullProps {
    action: GameAction
    userAddress?: string,
}

function RugPullPanel(props: RugPullProps) {
    const action = props.action
    const have = isSameAddress(action.sender, props.userAddress) ? "have" : "has"
    const reward = formatEthAmount(action.balance)

    return (<div className={`panel ${styles.game_progress_container}`}>
        <h1>🚨 RUG PULL 🚨</h1>
        <p>
            <Address address={action.sender} userAddress={props.userAddress}/>
            {' '}
            {have} run away with {reward} BNB</p>
    </div>)
}

interface FeedbackProps {
    feedback: string,
}

function Feedback(props: FeedbackProps) {
    return <div className={styles.feedback}>
        <code>{props.feedback}</code><br/><a href="" id="feedback_dismiss_link">Dismiss</a>
    </div>
}

interface PumpsProps {
    actions: GameAction[],
    userAddress?: string,
}

function Pumps(props: PumpsProps) {
    const pumpActions = props.actions.slice().reverse().map(action => {
        const balance = formatEthAmount(action.balance)
        return <tr key={action.balance}>
            <td><BlockLink block={action.block}/></td>
            <td><Address address={action.sender} userAddress={props.userAddress}/></td>
            <td>{balance}</td>
        </tr>
    })

    return (
        <React.Fragment>
            <h4>PUMPS</h4>
            <table className={styles.pumps}>
                <thead>
                <tr>
                    <th>Block</th>
                    <th>Address</th>
                    <th>Reward pool</th>
                </tr>
                </thead>
                <tbody>
                {pumpActions}
                </tbody>
            </table>
        </React.Fragment>
    )
}

interface AddressProps {
    address: string,
    userAddress?: string,
}

function Address(props: AddressProps) {
    const link = "https://bscscan.com/address/" + props.address
    let shortAddress = isSameAddress(props.address, props.userAddress) ? "you" : truncateAddress(props.address)

    return <a href={link} target="_blank">{shortAddress}</a>
}

function ConnectButton() {
    const dispatch = useAppDispatch()

    return <a onClick={() => dispatch(connectWallet())}>
        <button>CONNECT</button>
    </a>
}

function PumpButton() {
    const dispatch = useAppDispatch()

    return <a onClick={() => dispatch(pump())}>
        <button>PUMP</button>
    </a>
}

interface RugPullButton {
    enabled: boolean
}

function RugPullButton(props: RugPullButton) {
    const dispatch = useAppDispatch()

    return <a onClick={() => dispatch(rugPull())}>
        <button disabled={!props.enabled}>RUG PULL</button>
    </a>
}

interface BlockLinkProps {
    block: number
}

function BlockLink(props: BlockLinkProps) {
    const currentBlockLink = `https://bscscan.com/block/${props.block}`

    return <a target="_blank" href={currentBlockLink}>{props.block.toString()}</a>
}