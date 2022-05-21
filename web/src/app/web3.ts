import Web3 from "web3";
import contractABI from "./contractABI";

// Localhost
export const chainId = 31337
const nodeUrl = "ws://127.0.0.1:8545/";
const provider = new Web3.providers.WebsocketProvider(nodeUrl);

// Production
// export const chainId = 137
// const nodeUrl = "wss://speedy-nodes-nyc.moralis.io/e102e9a126b69cda253c682b/bsc/mainnet/ws";
// const provider = new Web3.providers.WebsocketProvider(nodeUrl);

export const web3 = new Web3(provider);

const contractAddresses = [
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
]

export const contracts = new Map(
    contractAddresses.map(address => {
        return [address, new web3.eth.Contract(contractABI, address)]
    }),
);

export const truncateAddress = (address: string) => address.substring(0, 6) + "…" + address.substring(38);
export const isSameAddress = (address1: string | undefined, address2: string | undefined) => {
    if (!address1 || !address2) return false
    return address1.toLowerCase() == address2.toLowerCase()
}
