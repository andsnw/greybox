const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const { scan } = require('../src/scanner');

describe("Contract Security Check", function () {
    async function deployContract(name) {
        const Contract = await ethers.getContractFactory(name);
        const contract = await Contract.deploy();
        await contract.deployed();
        return contract;
    }

    async function runScanAndCheck(contract, expectedResult) {
        const results = await scan(contract);
        const reentrancyCheck = results.find(check => check.name === 'Reentrancy');
        expect(reentrancyCheck).to.not.be.undefined;
        expect(reentrancyCheck.result).to.equal(expectedResult);
    }

    it("Should detect vulnerabilities in contracts", async function () {
        const contractsDir = path.join(__dirname, '..', 'contracts');
        const contractFiles = fs.readdirSync(contractsDir).filter(file => file.endsWith('.sol'));

        for (const file of contractFiles) {
            const contractName = path.basename(file, '.sol');
            const contract = await deployContract(contractName);
            console.log(`Scanning contract: ${contractName}`);
            await runScanAndCheck(contract, contractName.toLowerCase().includes('vulnerable') ? 'Vulnerable' : 'Safe');
        }
    });
});
