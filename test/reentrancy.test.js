const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const { scan } = require('../src/scanner');
const { runDynamicTests } = require('../src/dynamicTester');

describe("Dynamic Contract Security Check", function () {
    it("Should detect vulnerabilities in contracts", async function () {
        const contractsDir = path.join(__dirname, '..', 'contracts');
        const contractFiles = fs.readdirSync(contractsDir).filter(file => file.endsWith('.sol'));

        for (const file of contractFiles) {
            const contractPath = path.join(contractsDir, file);
            console.log(`Scanning contract: ${file}`);

            const scanResult = await scan(contractPath);
            const testResults = await runDynamicTests(scanResult.testSuites);

            for (const result of testResults) {
                console.log(`  ${result.name}: ${result.result}`);
                if (result.result === 'Vulnerable') {
                    expect(file.toLowerCase()).to.include('vulnerable');
                } else if (result.result === 'Safe') {
                    expect(file.toLowerCase()).not.to.include('vulnerable');
                }
            }
        }
    });
});
