const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
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
    console.log(`\nPreparing checks for: ${checkData.name}`);

    let staticVulnerabilities = [];

    for (const pattern of checkData.patterns) {
        for (const regex of pattern.regex) {
            const re = new RegExp(regex, 'g');
            let match;
            while ((match = re.exec(contractCode)) !== null) {
                staticVulnerabilities.push({
                    pattern: pattern.name,
                    description: pattern.description,
                    match: match[0],
                    lineNumber: findLineNumber(contractCode, match[0])
                });
            }
        }
    }

    // Strip comments from the test function
    const strippedTestFunction = checkData.test_function.replace(/\/\/.*$/gm, '').trim();

    return {
        name: checkData.name,
        description: checkData.description,
        severity: checkData.severity,
        mitigation: checkData.mitigation,
        reference: checkData.reference,
        contractName: contractName,
        test_function: strippedTestFunction,
        staticVulnerabilities: staticVulnerabilities
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
    let dynamicResults;
    try {
        dynamicResults = await runDynamicTests(staticResults, contractName, hre);
    } catch (error) {
        console.error('Error during dynamic testing:');
        console.error(error);
        dynamicResults = staticResults.map(result => ({
            name: result.name,
            result: 'Error',
            testType: 'Dynamic',
            error: error.message
        }));
    }

    const vulnerabilities = staticResults.flatMap(staticResult => {
        const dynamicResult = dynamicResults.find(dr => dr.name === staticResult.name);
        
        const staticFindings = staticResult.staticVulnerabilities.map(sv => ({
            ...staticResult,
            result: 'Vulnerable',
            testType: 'Static',
            vulnerability: sv
        }));

        const dynamicFinding = dynamicResult && (dynamicResult.result === 'Vulnerable' || dynamicResult.result === 'Error') 
            ? [{
                ...staticResult,
                result: dynamicResult.result,
                testType: 'Dynamic',
                error: dynamicResult.error
            }]
            : [];

        return [...staticFindings, ...dynamicFinding];
    });

    const output = {
        contractName: contractName,
        contractPath: contractPath,
        vulnerabilities: vulnerabilities
    };

    fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
    console.log('\nScan complete. Results saved to output.json');
    return output;
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
