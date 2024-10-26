const fs = require('fs');
const path = require('path');

async function generateDynamicTest(contractName, suite, hre) {
    const testContent = `
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("${suite.name} Test", function () {
  let contract;
  let owner;
  let attacker;

  before(async function () {
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
            const testResult = await hre.run("run-test", { testFile: testFilePath });

            if (testResult.status === 'fail') {
                const errorDetails = testResult.testResults.length > 0 
                    ? testResult.testResults[0].error 
                    : testResult.error;
                results.push({
                    name: suite.name,
                    result: 'Vulnerable',
                    testType: 'Dynamic',
                    error: errorDetails
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

    console.log("All test results:", JSON.stringify(results, null, 2));
    return results;
}

module.exports = { runDynamicTests };
