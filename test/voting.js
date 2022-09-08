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


});