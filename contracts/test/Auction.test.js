const chai = require("chai")
const { MockProvider } =  require("ethereum-waffle")
const { solidity } = require("ethereum-waffle")
chai.use(solidity)
const { expect } = chai
const provider = new MockProvider();

describe("Auction contract", function () {
    let auctionContract
    let owner
    let account1

    beforeEach(async function () {
        const contractFactory = await ethers.getContractFactory("Auction")
        auctionContract = await contractFactory.deploy()
        let signers = await ethers.getSigners()
        owner = signers[0]
        account1 = signers[1]
    })

    it("initial balance should be 0", async function () {
        const balance = await provider.getBalance(auctionContract.address);
        expect(balance).to.equal(0)
    })

})