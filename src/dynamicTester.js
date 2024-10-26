const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function generateMaliciousContract(contractAddress, contractABI, payload, hre) {
    // Ensure contractABI is an array
    const abiArray = Array.isArray(contractABI) ? contractABI : JSON.parse(contractABI);

    // Generate interface based on the contract ABI
    const interfaceFunctions = abiArray
        .filter(item => item.type === 'function')
        .map(func => {
            const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
            const outputs = func.outputs ? func.outputs.map(output => output.type).join(', ') : '';
            return `function ${func.name}(${inputs}) external${func.stateMutability === 'payable' ? ' payable' : ''}${outputs ? ` returns (${outputs})` : ''};`;
        })
        .join('\n    ');

    const contractSource = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    interface IVulnerableContract {
        ${interfaceFunctions}
    }

    contract MaliciousContract {
        IVulnerableContract public vulnerableContract;
        bool public attackSuccessful;

        constructor(address _vulnerableContractAddress) {
            vulnerableContract = IVulnerableContract(_vulnerableContractAddress);
        }

        function attack() external payable {
            ${payload}
        }

        receive() external payable {
            if (address(vulnerableContract).balance >= 1 ether) {
                vulnerableContract.withdraw();
            }
        }
    }
    `;

    // Write the contract to a temporary file in the contracts directory
    const contractsDir = path.join(hre.config.paths.root, 'contracts');
    const tempFilePath = path.join(contractsDir, 'MaliciousContract.sol');
    fs.writeFileSync(tempFilePath, contractSource);

    try {
        // Compile the contract
        await hre.run('compile');

        // Deploy the contract
        const MaliciousContractFactory = await hre.ethers.getContractFactory("MaliciousContract");
        const maliciousContract = await MaliciousContractFactory.deploy(contractAddress);
        await maliciousContract.deployed();

        return maliciousContract;
    } finally {
        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);
    }
}

async function runDynamicTests(staticResults, contractName, hre) {
    const results = [];

    try {
        const Contract = await ethers.getContractFactory(contractName);
        const contract = await Contract.deploy();
        await contract.deployed();

        console.log(`Contract deployed at: ${contract.address}`);

        const [owner, attacker] = await ethers.getSigners();

        for (const suite of staticResults) {
            console.log(`\nRunning dynamic test for: ${suite.name}`);

            try {
                let payloadResult;
                if (suite.name.toLowerCase().includes('reentrancy')) {
                    // For reentrancy, we need to deploy a malicious contract
                    const maliciousContract = await generateMaliciousContract(
                        contract.address,
                        Contract.interface.format(ethers.utils.FormatTypes.json),
                        suite.payload,
                        hre
                    );

                    // Fund the malicious contract
                    await owner.sendTransaction({
                        to: maliciousContract.address,
                        value: ethers.utils.parseEther("2")
                    });

                    // Attempt the attack
                    await maliciousContract.attack({ value: ethers.utils.parseEther("1") });
                    payloadResult = await maliciousContract.attackSuccessful();
                } else {
                    // For other vulnerabilities, we can run the payload directly
                    payloadResult = await eval(`(async () => { ${suite.payload} })()`);
                }

                results.push({
                    name: suite.name,
                    result: payloadResult ? 'Vulnerable' : 'Safe',
                    testType: 'Dynamic'
                });

                console.log(`  Result: ${payloadResult ? 'Vulnerable' : 'Safe'}`);
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
    } catch (error) {
        throw new Error(`Failed to deploy contract: ${error.message}`);
    }

    return results;
}

module.exports = { runDynamicTests };
