const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { ethers } = require("hardhat");

function findLineNumber(code, match) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(match)) {
            return i + 1;
        }
    }
    return -1;
}

async function runCheck(checkFile, contractCode) {
    const checkData = yaml.load(fs.readFileSync(checkFile, 'utf8'));

    let vulnerabilities = [];

    for (const pattern of checkData.patterns) {
        for (const regex of pattern.regex) {
            const re = new RegExp(regex, 'g');
            let match;
            while ((match = re.exec(contractCode)) !== null) {
                vulnerabilities.push({
                    pattern: pattern.name,
                    description: pattern.description,
                    match: match[0],
                    lineNumber: findLineNumber(contractCode, match[0])
                });
            }
        }
    }

    return {
        name: checkData.name,
        description: checkData.description,
        severity: checkData.severity,
        result: vulnerabilities.length > 0 ? 'Vulnerable' : 'Safe',
        vulnerabilities: vulnerabilities,
        mitigation: checkData.mitigation
    };
}

async function scan(contractPath) {
    // Read the contract source code
    const contractCode = fs.readFileSync(contractPath, 'utf8');

    // Get the contract name from the file name
    const contractName = path.basename(contractPath, '.sol');

    // Compile and deploy the contract
    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    console.log(`Contract deployed at address: ${contract.address}`);

    const templatesDir = path.join(__dirname, '..', 'templates');
    const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.yaml'));

    console.log(`Found ${templateFiles.length} checks to perform`);

    const results = await Promise.all(
        templateFiles.map(async (file) => {
            const checkFile = path.join(templatesDir, file);
            console.log(`Running check: ${path.basename(file, '.yaml')}`);
            return runCheck(checkFile, contractCode);
        })
    );

    fs.writeFileSync('output.json', JSON.stringify(results, null, 2));
    console.log('Scan complete. Results saved to output.json');
    return results;
}

// Main function
async function main() {
    // Get the contract path from command line arguments
    const contractPath = process.env.CONTRACT_PATH;
    if (!contractPath || !contractPath.endsWith('.sol')) {
        console.error('Please provide a valid contract file path using the CONTRACT_PATH environment variable');
        process.exit(1);
    }

    // Run the scan
    try {
        await scan(contractPath);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

// Run the main function
main();

module.exports = { scan };
