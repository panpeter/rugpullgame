const chai = require("chai")
const { solidity } = require("ethereum-waffle")
chai.use(solidity)
const { expect } = chai

describe("Auction contract", function () {
    let auctionContract
    let owner
    let account1
    let account2

    const ONE_ETH = ethers.utils.parseEther("1")

    const auctionBalance = function () {
        return ethers.provider.getBalance(auctionContract.address)
    }

    beforeEach(async function () {
        const contractFactory = await ethers.getContractFactory("Auction")
        auctionContract = await contractFactory.deploy()
        let signers = await ethers.getSigners()
        owner = signers[0]
        account1 = signers[1]
        account2 = signers[2]
    })

    it("initial balance should be 0", async function () {
        expect(await auctionBalance()).to.equal(0)
    })

    it("a bid must send ether", async function () {
        await expect(
            auctionContract.connect(account1).bid()
        ).to.be.revertedWith("Bid price must be 1 ether or more")
    })

    it("bid increases auction balance", async function () {
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        expect(await auctionBalance()).to.equal(ONE_ETH)
    })

    it("bid adds bidder to lastBidders", async function () {
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        expect(await auctionContract.getLastBidders()).to.eql([account1.address]);
    })

    it("lastBidders can have multiple addresses", async function () {
        await ethers.provider.send("evm_setAutomine", [false])

        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        await auctionContract.connect(account2).bid({ value: ONE_ETH })
        await ethers.provider.send("evm_mine")

        expect(await auctionContract.getLastBidders()).to.eql([account1.address, account2.address])

        await ethers.provider.send("evm_setAutomine", [true])
    })

    it("new bid resets lastBidders", async function () {
        await ethers.provider.send("evm_setAutomine", [false])

        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        await ethers.provider.send("evm_mine")

        await auctionContract.connect(account2).bid({ value: ONE_ETH })
        await ethers.provider.send("evm_mine")

        expect(await auctionContract.getLastBidders()).to.eql([account2.address])

        await ethers.provider.send("evm_setAutomine", [true])
    })

    it("cannot claim if not enough blocks passed", async function () {
        await ethers.provider.send("evm_setAutomine", [false])

        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        await ethers.provider.send("evm_mine")
        await ethers.provider.send("evm_mine")

        await ethers.provider.send("evm_setAutomine", [true])

        await expect(
            auctionContract.connect(account1).claim()
        ).to.be.revertedWith("At least 10 blocks must pass before a claim is made")
    })

    it("allows to claim", async function () {
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        for (let i = 0; i < 9; i++) {
            await ethers.provider.send("evm_mine")
        }
        let account1Balance = await ethers.provider.getBalance(account1.address)
        await auctionContract.connect(account2).claim()

        expect(await ethers.provider.getBalance(account1.address)).to.equal(account1Balance.add(ONE_ETH))
    })

    it("rewards whole balance", async function () {
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        await auctionContract.connect(account2).bid({ value: ONE_ETH })
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        for (let i = 0; i < 9; i++) {
            await ethers.provider.send("evm_mine")
        }

        let account1Balance = await ethers.provider.getBalance(account1.address)
        await auctionContract.connect(owner).claim()

        expect(await ethers.provider.getBalance(account1.address)).to.equal(account1Balance.add(ONE_ETH.mul(3)))
    })

    it("splits the reward", async function () {
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        await ethers.provider.send("evm_setAutomine", [false])
        await auctionContract.connect(account2).bid({ value: ONE_ETH })
        await auctionContract.connect(account1).bid({ value: ONE_ETH })
        await ethers.provider.send("evm_setAutomine", [true])
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send("evm_mine")
        }

        let account1Balance = await ethers.provider.getBalance(account1.address)
        let account2Balance = await ethers.provider.getBalance(account2.address)
        await auctionContract.connect(owner).claim()

        let reward = ONE_ETH.mul(3).div(2)
        expect(await ethers.provider.getBalance(account1.address)).to.equal(account1Balance.add(reward))
        expect(await ethers.provider.getBalance(account2.address)).to.equal(account2Balance.add(reward))
    })
})