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
            votingContract.connect(accounts[0]).addVoting(VOTING_PERIOD, candidates)
        ).to.be.revertedWith("Too many candidates!");    
    });


});