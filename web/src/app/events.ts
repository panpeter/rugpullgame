import {contracts, web3} from "./web3";
import {EventData} from "web3-eth-contract";
import {store} from "./store";
import {accountsChanged, disconnected, missingMetamask} from "../features/wallet/walletSlice";
import {handleNewBlockEvent, handlePumpEvent, handleRugPullEvent} from "../features/game/gameSlice";

export const dispatchEthereumEvents = () => {
    const ethereum = window.ethereum
    if (ethereum) {
        ethereum.on('accountsChanged', (accounts: Array<string>) => {
            store.dispatch(accountsChanged(accounts))
        });
        ethereum.on('disconnect', () => {
            store.dispatch(disconnected())
        });
        ethereum.on('chainChanged', () => window.location.reload());
    } else {
        store.dispatch(missingMetamask())
    }
}

export const dispatchPumpEvents = () => {
    contracts.forEach(contract => {
        contract.events.PumpEvent({fromBlock: "latest"})
            .on('data', (event: EventData) => store.dispatch(handlePumpEvent(event)))
    })
}

export const dispatchRugPullEvents = () => {
    contracts.forEach(contract => {
        contract.events.RugPullEvent({fromBlock: "latest"})
            .on('data', (event: EventData) => store.dispatch(handleRugPullEvent(event)))
    })
}

export const dispatchBlockEvents = () => {
    web3.eth.subscribe("newBlockHeaders", (error, result) => {
        if (error == null) {
            store.dispatch(handleNewBlockEvent(result))
        }
    })
}

