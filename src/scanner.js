const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { ethers } = require("hardhat");
const { runDynamicTests } = require('./dynamicTester');
const hre = require("hardhat");
function findLineNumber(code, match) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(match)) {
            return i + 1;
        }
    }
    return -1;
}

async function runStaticChecks(checkFile, contractCode, contractName) {
    const checkData = yaml.load(fs.readFileSync(checkFile, 'utf8'));
    console.log(`\nRunning static checks for: ${checkData.name}`);

    let vulnerabilities = [];

    for (const pattern of checkData.patterns) {
        console.log(`\n  Checking pattern: ${pattern.name}`);
        for (const regex of pattern.regex) {
            const re = new RegExp(regex, 'g');
            let match;
            while ((match = re.exec(contractCode)) !== null) {
                console.log(`    Found potential vulnerability: ${match[0]}`);
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
        vulnerabilities: vulnerabilities,
        mitigation: checkData.mitigation,
        contractName: contractName,
        payload: checkData.payload
    };
}

async function scan(contractPath) {
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    const contractName = path.basename(contractPath, '.sol');

    const templatesDir = path.join(__dirname, '..', 'templates');
    const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.yaml'));

    console.log(`\nFound ${templateFiles.length} checks to perform`);

    const staticResults = await Promise.all(
        templateFiles.map(async (file) => {
            const checkFile = path.join(templatesDir, file);
            return runStaticChecks(checkFile, contractCode, contractName);
        })
    );

    console.log("\nRunning dynamic tests...");
    try {
        const dynamicResults = await runDynamicTests(staticResults, contractName, hre);

        const results = staticResults.map((staticResult, index) => {
            const dynamicResult = dynamicResults[index];
            if (dynamicResult.result === 'Vulnerable') {
                return {
                    ...staticResult,
                    dynamicResult: dynamicResult
                };
            }
            return null;
        }).filter(result => result !== null);

        const output = {
            contractName: contractName,
            contractPath: contractPath,
            vulnerabilities: results
        };

        fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
        console.log('\nScan complete. Results saved to output.json');
        return output;
    } catch (error) {
        console.error('Error during dynamic testing:');
        console.error(error);
        process.exit(1);
    }
}

// Main function
async function main() {
    const contractPath = process.env.CONTRACT_PATH;
    if (!contractPath || !contractPath.endsWith('.sol')) {
        console.error('Please provide a valid contract file path using the CONTRACT_PATH environment variable');
        process.exit(1);
    }

    console.log(`Scanning contract: ${contractPath}`);

    try {
        await scan(contractPath);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

// Run the main function if this script is run directly
if (require.main === module) {
    main();
}

module.exports = { scan };
