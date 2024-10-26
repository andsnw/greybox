const { ethers } = require("hardhat");
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

  beforeEach(async function () {
    const Contract = await ethers.getContractFactory("${contractName}");
    contract = await Contract.deploy();
    await contract.deployed();
    [owner, attacker] = await ethers.getSigners();
  });

  it("Should check for ${suite.name} vulnerability", async function () {
    // Wrap the test function in a try-catch to handle potential missing functions
    try {
      const isVulnerable = await (async () => { ${suite.test_function} })();
      expect(isVulnerable).to.be.false;
    } catch (error) {
      if (error.message.includes("is not a function")) {
        console.log("Skipping test due to missing function in contract");
        this.skip();
      } else {
        throw error;
      }
    }
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
        console.log(`\nGenerating and running dynamic test for: ${suite.name}`);

        try {
            const testFilePath = await generateDynamicTest(contractName, suite, hre);

            // Run the generated test
            try {
                await hre.run("test", { testFiles: [testFilePath] });
                results.push({
                    name: suite.name,
                    result: 'Safe',
                    testType: 'Dynamic'
                });
            } catch (error) {
                if (error.message.includes("Skipping test due to missing function")) {
                    results.push({
                        name: suite.name,
                        result: 'Skipped',
                        testType: 'Dynamic',
                        error: 'Required function not found in contract'
                    });
                } else {
                    // This is the case where we've detected a vulnerability
                    results.push({
                        name: suite.name,
                        result: 'Vulnerable',
                        testType: 'Dynamic',
                        error: error.message
                    });
                }
            }

            // Clean up the generated test file
            fs.unlinkSync(testFilePath);

        } catch (error) {
            console.error(`  Error running dynamic test for ${suite.name}: ${error.message}`);
            results.push({
                name: suite.name,
                result: 'Error',
                testType: 'Dynamic',
                error: error.message
            });
        }
    }

    return results;
}

module.exports = { runDynamicTests };
