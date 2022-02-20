const chai = require("chai")
const { solidity } = require("ethereum-waffle")
chai.use(solidity)
const { expect } = chai

describe("RugPullGame contract", function () {
    let contract
    let owner
    let account1
    let account2

    const ONE_ETH = ethers.utils.parseEther("1")

    const contractBalance = function () {
        return ethers.provider.getBalance(contract.address)
    }

    beforeEach(async function () {
        const contractFactory = await ethers.getContractFactory("RugPullGame")
        contract = await contractFactory.deploy()
        let signers = await ethers.getSigners()
        owner = signers[0]
        account1 = signers[1]
        account2 = signers[2]
    })

    it("should have inital balance equal 0", async function () {
        expect(await contractBalance()).to.equal(0)
    })

    it("reverts when pumper does not pay fee", async function () {
        await expect(
            contract.connect(account1).pump()
        ).to.be.revertedWith("Pump fee must be at least 1 MATIC")
    })

    it("increases the balance when it's pumped", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        expect(await contractBalance()).to.equal(ONE_ETH)
    })

    it("adds pumper to latest pumpers", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        expect(await contract.getLatestPumpers()).to.eql([account1.address]);
    })

    it("can have multiple latest pumpers", async function () {
        await ethers.provider.send("evm_setAutomine", [false])
        await contract.connect(account1).pump({ value: ONE_ETH })
        await ethers.provider.send("evm_setAutomine", [true])
        await contract.connect(account2).pump({ value: ONE_ETH })

        expect(await contract.getLatestPumpers()).to.eql([account1.address, account2.address])
    })

    it("holds only latest pumpers", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        await contract.connect(account2).pump({ value: ONE_ETH })

        expect(await contract.getLatestPumpers()).to.eql([account2.address])
    })

    it("reverts rug pull when not enough blocks passed", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        await ethers.provider.send("evm_mine")
        await ethers.provider.send("evm_mine")

        await expect(
            contract.connect(account1).pullTheRug()
        ).to.be.revertedWith("At least 10 blocks must pass before a rug pull")
    })

    it("allows to pull the rug", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        for (let i = 0; i < 9; i++) {
            await ethers.provider.send("evm_mine")
        }
        let account1Balance = await ethers.provider.getBalance(account1.address)
        await contract.connect(account2).pullTheRug()

        expect(await ethers.provider.getBalance(account1.address)).to.equal(account1Balance.add(ONE_ETH))
    })

    it("transfers whole balance when a pumper pulls the rug", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        await contract.connect(account2).pump({ value: ONE_ETH })
        await contract.connect(account1).pump({ value: ONE_ETH })
        for (let i = 0; i < 9; i++) {
            await ethers.provider.send("evm_mine")
        }

        let account1Balance = await ethers.provider.getBalance(account1.address)
        await contract.connect(owner).pullTheRug()

        expect(await ethers.provider.getBalance(account1.address)).to.equal(account1Balance.add(ONE_ETH.mul(3)))
    })

    it("splits the reward", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        await ethers.provider.send("evm_setAutomine", [false])
        await contract.connect(account2).pump({ value: ONE_ETH })
        await contract.connect(account1).pump({ value: ONE_ETH })
        await ethers.provider.send("evm_setAutomine", [true])
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send("evm_mine")
        }

        let account1Balance = await ethers.provider.getBalance(account1.address)
        let account2Balance = await ethers.provider.getBalance(account2.address)
        await contract.connect(owner).pullTheRug()

        let reward = ONE_ETH.mul(3).div(2)
        expect(await ethers.provider.getBalance(account1.address)).to.equal(account1Balance.add(reward))
        expect(await ethers.provider.getBalance(account2.address)).to.equal(account2Balance.add(reward))
    })

    it("emits Pump event", async function () {
        let tx = await contract.connect(account1).pump({ value: ONE_ETH })
        let rc = await tx.wait()
        let event = rc.events.find(event => event.event === 'Pump')
        let [pumper, balance] = event.args
        
        expect(pumper).to.be.eql(account1.address)
        expect(balance).to.be.equal(ONE_ETH)
    })

    it("emits Pump event with correct balance", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        let tx = await contract.connect(account2).pump({ value: ONE_ETH })
        let rc = await tx.wait()
        let event = rc.events.find(event => event.event === 'Pump')
        let [pumper, balance] = event.args
        
        expect(pumper).to.be.eql(account2.address)
        expect(balance).to.be.equal(ONE_ETH.mul(2))
    })

    it("emits RugPull event", async function () {
        await contract.connect(account1).pump({ value: ONE_ETH })
        await contract.connect(account2).pump({ value: ONE_ETH })
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send("evm_mine")
        }
        
        let tx = await contract.connect(account2).pullTheRug()
        let rc = await tx.wait()
        let event = rc.events.find(event => event.event === 'RugPull')
        let [pumpers, reward] = event.args
        
        expect(pumpers).to.be.eql([account2.address])
        expect(reward).to.be.equal(ONE_ETH.mul(2))
    })
})