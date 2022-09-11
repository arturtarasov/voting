const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
    const MAX_CANDIDATE_NUM = 10;
    const COMISSION = 5;
    const VOTING_PERIOD = 180;
    let owner, buyer, votingContract, accounts;
    beforeEach(async function () {
        accounts = await ethers.getSigners()
        owner = accounts[0]
        const VotingContract = await ethers.getContractFactory("VotingContract", owner)
        votingContract = await VotingContract.deploy(MAX_CANDIDATE_NUM, COMISSION)
        await votingContract.deployed()
    })

    it("sets owner", async function () {
        expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("owner try to create voting with too many candidates", async function () {
        const candidates = new Array()
        const maxCandidatesNumError = MAX_CANDIDATE_NUM * 2
        
        for (i = 1; i < maxCandidatesNumError; i++) candidates.push(accounts[i].address)
        await expect(
            votingContract.connect(owner).addVoting(VOTING_PERIOD, candidates)
        ).to.be.revertedWith("Too many candidates!");    
    });

    it("owner created a vote, the counter is increased", async function(){
        const counterBefore = await votingContract.counter()
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        await votingContract.connect(owner).addVoting(VOTING_PERIOD, candidates)
        const counterAfter = await votingContract.counter()
        expect(counterAfter - counterBefore).to.equal(1)
        const isCandidateFromVoting = await votingContract.checkCandidate(counterBefore, accounts[1].address)
        expect(isCandidateFromVoting).to.equal(true)
    });

    it("owner created another voting", async function () {
        const counterBefore = await votingContract.counter()
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        await votingContract.connect(owner).addVoting(VOTING_PERIOD, candidates)
        const isCandidateFromVoting = await votingContract.checkCandidate(counterBefore, accounts[MAX_CANDIDATE_NUM + 1].address)
        expect(isCandidateFromVoting).to.equal(false)
    });

    it("some candidate deleted", async function () {
        const candidate = accounts[2]
        await votingContract.connect(owner).deleteCandidate(0, candidate.address)
        const isCandidateFromVoting = await votingContract.checkCandidate(0, candidate.address)
        expect(isCandidateFromVoting).to.equal(false)
    });

    it("some candidate added", async function () {
        const candidate = accounts[2]
        await votingContract.connect(owner).addCandidate(0, candidate.address)
        const isCandidateFromVoting = await votingContract.checkCandidate(0, candidate.address)
        expect(isCandidateFromVoting).to.equal(true)
    });

    it("only owner can delete candidate", async function () {
        const candidate = accounts[2]
        const notOwner = accounts[3]
        await expect(
            votingContract.connect(notOwner).deleteCandidate(0, candidate.address)
        ).to.be.revertedWith("Error! You're not the smart contract owner!")
    });

    it("owner changed voting period", async function () {
        const newVotingPeriod = 190
        await votingContract.connect(owner).editVotingPeriod(0, newVotingPeriod)
        const votingInfo = await votingContract.getVotingInfo(0)
        expect(votingInfo[2]).to.equal(newVotingPeriod)
    });
    
    it("nobody can't vote before start", async function () {
        const amount = new ethers.BigNumber.from(10).pow(18).mul(1)
        await expect(
            votingContract.connect(accounts[1]).takePartInVoting(0, accounts[3].address, { value: amount })
        ).to.be.revertedWith("Voting not started yet")
    });

    it("voting started", async function () {
        await votingContract.connect(owner).startVoting(0)
        const votingInfo = await votingContract.getVotingInfo(0)
        expect(votingInfo[0]).to.equal(true)
    });

    it("candidate can not be deleted after voting start", async function () {
        const candidate = accounts[3]
        const contract = await votingContract.connect(owner)
        await contract.addCandidate(0, candidate.address)
        await contract.startVoting(0)
        
        await expect(
            contract.deleteCandidate(0, candidate.address)
        ).to.be.revertedWith("Voting has already begun!")
    });

    it("period can not be changed after voting start", async function () {
        const newVotingPeriod = 190
        const contract = await votingContract.connect(owner)
        await contract.startVoting(0)
        await expect(
            contract.editVotingPeriod(0, newVotingPeriod)
        ).to.be.revertedWith("Voting has already begun!")
    });

    it("voting for candidate that not exist in this voting", async function () {
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        const contract = await votingContract.connect(owner)
        await contract.addVoting(VOTING_PERIOD, candidates)
        await contract.startVoting(0)
        await expect(
            contract.takePartInVoting(0, accounts[11].address)
        ).to.be.revertedWith("Candidate does not exist on this voting")
    });

    it("candidate 1 voted for candidate 3", async function () {
        const amount = new ethers.BigNumber.from(10).pow(18).mul(1)
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        const contract = await votingContract.connect(owner)
        await contract.addVoting(VOTING_PERIOD, candidates)
        await contract.startVoting(0)


        await votingContract.connect(accounts[1]).takePartInVoting(0, accounts[2].address, { value: amount })
        const votingInfo = await votingContract.getVotingInfo(0)
        expect(votingInfo[5]).to.equal(accounts[2].address)
    });

    it("candidate 2 and 4 voted for candidate 5", async function () {
        const amount = new ethers.BigNumber.from(10).pow(18).mul(1)
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        const contract = await votingContract.connect(owner)
        await contract.addVoting(VOTING_PERIOD, candidates)
        await contract.startVoting(0)

        await votingContract.connect(accounts[2]).takePartInVoting(0, accounts[5].address, { value: amount })
        await votingContract.connect(accounts[4]).takePartInVoting(0, accounts[5].address, { value: amount })
        const votingInfo = await votingContract.getVotingInfo(0)
        expect(votingInfo[5]).to.equal(accounts[5].address)
    });

    it("candidate 5 try to withdrow", async function () {
        const amount = new ethers.BigNumber.from(10).pow(18).mul(1)
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        const contract = await votingContract.connect(owner)
        await contract.addVoting(VOTING_PERIOD, candidates)
        await contract.startVoting(0)

        await votingContract.connect(accounts[2]).takePartInVoting(0, accounts[5].address, { value: amount })
        await votingContract.connect(accounts[4]).takePartInVoting(0, accounts[5].address, { value: amount })

        await expect(
            votingContract.connect(accounts[5]).WithdrowMyPrize(0)
        ).to.be.revertedWith("Voting is not over yet!")
    });
    it("candidate 4 try to withdrow after time", async function () {
        const amount = new ethers.BigNumber.from(10).pow(18).mul(1)
        const candidates = new Array()
        for (i = 1; i < MAX_CANDIDATE_NUM; i++) candidates.push(accounts[i].address)
        const contract = await votingContract.connect(owner)
        await contract.addVoting(VOTING_PERIOD, candidates)
        await contract.startVoting(0)

        await votingContract.connect(accounts[2]).takePartInVoting(0, accounts[5].address, { value: amount })
        await votingContract.connect(accounts[4]).takePartInVoting(0, accounts[5].address, { value: amount })

        await network.provider.send("evm_increaseTime", [200])
        await network.provider.send("evm_mine")
        await expect(
            votingContract.connect(accounts[4]).WithdrowMyPrize(0)
        ).to.be.revertedWith("You are not a winner!")
    });


});