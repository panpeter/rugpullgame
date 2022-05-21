const chai = require("chai")
const {solidity} = require("ethereum-waffle")
const {BigNumber} = require("ethers");
chai.use(solidity)
const {expect} = chai

describe("RugPullGame contract", function () {
    let contract
    let owner
    let account1
    let account2
    let pumpFee
    let rugPullBlocks
    let devCommissionDiv

    const contractBalance = () => {
        return ethers.provider.getBalance(contract.address)
    }

    const startGame = async () => {
        const blockNumber = await ethers.provider.getBlockNumber()
        const startBlock = await contract.START_BLOCK()
        const blockLeft = startBlock - blockNumber
        for (let i = 0; i < blockLeft; i++) {
            await ethers.provider.send("evm_mine")
        }
    }

    beforeEach(async function () {
        const contractFactory = await ethers.getContractFactory("RugPullGame")
        contract = await contractFactory.deploy()
        let signers = await ethers.getSigners()
        owner = signers[0]
        account1 = signers[1]
        account2 = signers[2]
        pumpFee = await contract.PUMP_FEE()
        rugPullBlocks = await contract.RUG_PULL_BLOCKS()
        devCommissionDiv = await contract.DEV_COMMISSION_DIV()
    })

    it("reverts when game has not started yet", async function () {
        expect(contract.pump()).to.be.revertedWith("Game has not started yet")
    })

    it("reverts when pumper does not pay fee", async function () {
        await startGame()
        expect(contract.pump()).to.be.revertedWith("Not enough ether send")
    })

    it("increases the balance when it's pumped", async function () {
        startGame()
        await contract.pump({value: pumpFee})
        expect(await contractBalance()).to.equal(pumpFee)
    })

    it("reverts rug pull when not enough blocks passed", async function () {
        startGame()
        await contract.pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks - 2; i++) {
            await ethers.provider.send("evm_mine")
        }

        expect(contract.rugPull()).to.be.revertedWith("Cannot do a rug pull just yet")
    })

    it("allows to rug pull", async function () {
        startGame()
        await contract.connect(account1).pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }

        const devCommission = pumpFee / devCommissionDiv
        await expect(await contract.rugPull()).to.changeEtherBalance(account1, pumpFee - devCommission)
    })

    it("sends commission to dev", async function () {
        startGame()
        await contract.connect(account1).pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        const devCommission = pumpFee / devCommissionDiv

        await expect(await contract.connect(account1).rugPull()).to.changeEtherBalance(owner, devCommission)
    })

    it("transfers whole balance when a pumper pulls the rug", async function () {
        await contract.connect(account1).pump({value: pumpFee})
        await contract.connect(account2).pump({value: pumpFee})
        await contract.connect(account1).pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        const devCommission = BigNumber.from(pumpFee).mul(3).div(devCommissionDiv)
        const reward = BigNumber.from(pumpFee).mul(3).sub(devCommission)

        await expect(await contract.rugPull()).to.changeEtherBalance(account1, reward)
    })

    it("emits pump event", async function () {
        startGame()
        await expect(await contract.pump({value: pumpFee}))
            .to.emit(contract, 'PumpEvent')
            .withArgs(owner.address, pumpFee);
    })

    it("emits pump event with correct balance", async function () {
        startGame()
        await contract.pump({value: pumpFee})
        await expect(await contract.pump({value: pumpFee}))
            .to.emit(contract, 'PumpEvent')
            .withArgs(owner.address, BigNumber.from(pumpFee).mul(2));
    })

    it("emits rug pull event", async function () {
        startGame()
        await contract.pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        await expect(await contract.rugPull())
            .to.emit(contract, 'RugPullEvent')
            .withArgs(owner.address, BigNumber.from(pumpFee));
    })

    it("keeps actions history", async function () {
        startGame()
        await contract.pump({value: pumpFee})
        await contract.connect(account1).pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        await contract.rugPull()
        const actions = await contract.getActions()

        expect(actions.length).to.eql(3)

        const action0 = actions[0]
        expect(action0.sender).to.eql(owner.address);
        expect(action0.balance).to.eql(pumpFee)
        expect(action0.rugPull).to.eql(false)

        const action1 = actions[1]
        expect(action1.sender).to.eql(account1.address)
        expect(action1.balance).to.eql(BigNumber.from(pumpFee).mul(2))
        expect(action1.rugPull).to.eql(false)

        const action2 = actions[2]
        expect(action2.sender).to.eql(account1.address)
        expect(action2.balance).to.eql(BigNumber.from(pumpFee).mul(2))
        expect(action2.rugPull).to.eql(true)
    })
})