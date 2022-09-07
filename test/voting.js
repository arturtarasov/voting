const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
    let owner, buyer, voting;
    beforeEach(async function () {
        [owner, buyer] = await ethers.getSigners()

        const VotingContract = await ethers.getContractFactory("VotingContract", owner)
        voting = await VotingContract.deploy(10, 5)
        await voting.deployed()
    })

    it("sets owner", async function () {
        expect(await voting.owner()).to.equal(owner.address);
    });

});