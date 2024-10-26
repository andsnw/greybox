const fs = require('fs');
const path = require('path');
// const assert = require('assert');
// const { Writable } = require('stream');
const Mocha = require('mocha');

async function generateDynamicTest(contractName, suite, hre) {
    const testContent = `
const assert = require('assert');
const { ethers } = require("hardhat");

describe("${suite.name} Test", function () {
  let contract;
  let owner;
  let attacker;

  before(async function () {
    await hre.run('compile');
    const Contract = await ethers.getContractFactory("${contractName}");
    contract = await Contract.deploy();
    await contract.deployed();
    [owner, attacker] = await ethers.getSigners();
  });

  it("Should check for ${suite.name} vulnerability", async function () {
    ${suite.test_function}
  });
});
`;

    const testsDir = path.join(hre.config.paths.root, 'test');
    if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir);
    }
    const testFilePath = path.join(testsDir, `${suite.name.toLowerCase().replace(/\s+/g, '_')}_test.js`);
    fs.writeFileSync(testFilePath, testContent);

    return testFilePath;
}

async function runDynamicTests(staticResults, contractName, hre) {
    const results = [];

    for (const suite of staticResults) {
        console.log(`\nGenerating dynamic test for: ${suite.name}`);
        const testFilePath = await generateDynamicTest(contractName, suite, hre);

        try {
            const mocha = new Mocha({
                reporter: 'json',
                timeout: 30000, // Increase timeout to 30 seconds
                quiet: true
            });

            mocha.addFile(testFilePath);

            const jsonOutput = await new Promise((resolve) => {
                mocha.run()
                    .on('end', function () {
                        resolve(this.testResults);
                    });
            });

            if (jsonOutput.failures && jsonOutput.failures.length > 0) {
                results.push({
                    name: suite.name,
                    result: 'Vulnerable',
                    testType: 'Dynamic',
                    error: JSON.stringify(jsonOutput.failures)
                });
            } else {
                results.push({
                    name: suite.name,
                    result: 'Safe',
                    testType: 'Dynamic'
                });
            }
        } catch (error) {
            console.error(`Error running test for ${suite.name}: ${error.message}`);
            results.push({
                name: suite.name,
                result: 'Error',
                testType: 'Dynamic',
                error: error.message
            });
        } finally {
            fs.unlinkSync(testFilePath);
        }
    }

    console.log("\nAll test results:", JSON.stringify(results, null, 2));
    return results;
}

module.exports = { runDynamicTests };
