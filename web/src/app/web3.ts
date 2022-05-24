import Web3 from "web3";
import contractABI from "./contractABI";

// Localhost
// export const chainId = 31337
// const nodeUrl = "ws://127.0.0.1:8545/";

// Test Net
// export const chainId = 80001
// const nodeUrl = "wss://speedy-nodes-nyc.moralis.io/e102e9a126b69cda253c682b/polygon/mumbai/ws";

// Production
export const chainId = 137
const nodeUrl = "wss://speedy-nodes-nyc.moralis.io/e102e9a126b69cda253c682b/polygon/mainnet/ws";

const provider = new Web3.providers.WebsocketProvider(nodeUrl);
export const web3 = new Web3(provider);

const contractAddresses = [
    "0xB55DD5b91Ef815cEc527e054B67f4D298111aD9F"
]
export const contracts = new Map(
    contractAddresses.map(address => {
        return [address, new web3.eth.Contract(contractABI, address)]
    }),
);

export const truncateAddress = (address: string) => address.substring(0, 6) + "…" + address.substring(38);
export const isSameAddress = (address1: string | undefined, address2: string | undefined) => {
    if (!address1 || !address2) return false
    return address1.toLowerCase() === address2.toLowerCase()
}
export const formatEthAmount = (
    amount: string
) => Number.parseFloat(web3.utils.fromWei(amount, "ether")).toFixed(0)
