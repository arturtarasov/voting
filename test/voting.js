const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
    let owner, buyer, votingContract, accounts;
    beforeEach(async function () {
        accounts = await ethers.getSigners()
        owner = accounts[0]
        const VotingContract = await ethers.getContractFactory("VotingContract", owner)
        votingContract = await VotingContract.deploy(10, 5)
        await votingContract.deployed()
    })

    it("sets owner", async function () {
        expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("owner try to create voting with too many candidates", async function () {
        let candidates = new Array();
        
        for (i = 1; i < 20; i++) candidates.push(accounts[i].address);
        await expect(
            votingContract.connect(accounts[0]).addVoting(180, candidates)
        ).to.be.revertedWith("Too many candidates!");    
    });

});