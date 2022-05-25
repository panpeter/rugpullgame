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
    let pumpFeeDiv
    let rugPullBlocks
    let devCommissionDiv

    const contractBalance = () => {
        return ethers.provider.getBalance(contract.address)
    }

    beforeEach(async function () {
        const contractFactory = await ethers.getContractFactory("RugPullGame")
        contract = await contractFactory.deploy()
        let signers = await ethers.getSigners()
        owner = signers[0]
        account1 = signers[1]
        account2 = signers[2]
        pumpFeeDiv = await contract.PUMP_FEE_DIV()
        rugPullBlocks = await contract.RUG_PULL_BLOCKS()
        devCommissionDiv = await contract.DEV_COMMISSION_DIV()
    })

    it("reverts when game has not started yet", async function () {
        await contract.startOver(5)
        expect(contract.pump()).to.be.revertedWith("Game has not started yet")
    })

    it("reverts when pumper does not send any fee", async function () {
        await owner.sendTransaction({
            to: contract.address,
            value: ethers.utils.parseEther("1"),
        });

        expect(contract.pump()).to.be.revertedWith("Not enough ether send")
    })

    it("reverts when pump is less than 1% of pool", async function () {
        await owner.sendTransaction({
            to: contract.address,
            value: ethers.utils.parseEther("1"),
        });

        const pumpFee = ethers.utils.parseEther("0.0090")

        expect(contract.pump()).to.be.revertedWith("Not enough ether send")
    })

    it("allows to pump with 1% of pool", async function () {
        await owner.sendTransaction({
            to: contract.address,
            value: ethers.utils.parseEther("1"),
        });

        const pumpFee = ethers.utils.parseEther("0.01")
        await contract.pump({value: pumpFee})
        expect(await contractBalance()).to.equal(ethers.utils.parseEther("1.01"))
    })

    it("allows to pump with more than 1% of pool", async function () {
        await owner.sendTransaction({
            to: contract.address,
            value: ethers.utils.parseEther("1"),
        });

        const pumpFee = ethers.utils.parseEther("0.02")
        await contract.pump({value: pumpFee})
        expect(await contractBalance()).to.equal(ethers.utils.parseEther("1.02"))
    })

    it("reverts rug pull when not enough blocks passed", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks - 2; i++) {
            await ethers.provider.send("evm_mine")
        }

        expect(contract.rugPull()).to.be.revertedWith("Cannot do a rug pull just yet")
    })

    it("allows to rug pull", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.connect(account1).pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }

        const devCommission = pumpFee.div(devCommissionDiv)
        await expect(await contract.rugPull()).to.changeEtherBalance(account1, pumpFee.sub(devCommission))
    })

    it("sends commission to dev", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.connect(account1).pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        const devCommission = pumpFee.div(devCommissionDiv)

        await expect(await contract.connect(account1).rugPull()).to.changeEtherBalance(owner, devCommission)
    })

    it("transfers whole balance when a pumper pulls the rug", async function () {
        const pumpFee = ethers.utils.parseEther("1")
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
        const pumpFee = ethers.utils.parseEther("1")
        await expect(await contract.pump({value: pumpFee}))
            .to.emit(contract, 'PumpEvent')
            .withArgs(owner.address, pumpFee);
    })

    it("emits pump event with correct balance", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.pump({value: pumpFee})
        await expect(await contract.pump({value: pumpFee}))
            .to.emit(contract, 'PumpEvent')
            .withArgs(owner.address, BigNumber.from(pumpFee).mul(2));
    })

    it("emits rug pull event", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        await expect(await contract.rugPull())
            .to.emit(contract, 'RugPullEvent')
            .withArgs(owner.address, BigNumber.from(pumpFee));
    })

    it("keeps actions history", async function () {
        const pumpFee = ethers.utils.parseEther("1")
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

    it("cannot start over when players are pumping", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.pump({value: pumpFee})
        expect(contract.startOver(100)).to.be.revertedWith("Game has not finished yet")
    })

    it("starts over", async function () {
        const pumpFee = ethers.utils.parseEther("1")
        await contract.pump({value: pumpFee})
        for (let i = 0; i < rugPullBlocks; i++) {
            await ethers.provider.send("evm_mine")
        }
        await contract.rugPull()
        await contract.startOver(100)
        const actions = await contract.getActions()

        expect(actions.length).to.eql(0)
    })
})