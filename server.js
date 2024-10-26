const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

app.post('/scan', async (req, res) => {
    if (!req.body.contractContent || !req.body.fileName) {
        return res.status(400).send('No contract content or file name provided.');
    }

    try {
        let contractContent = req.body.contractContent;
        const fileName = req.body.fileName;

        // Generate a unique name for the contract
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const uniqueContractName = `TempContract_${uniqueId}`;

        // Replace the original contract name with the unique name
        const contractNameRegex = /contract\s+(\w+)/;
        const originalContractName = contractContent.match(contractNameRegex)[1];
        contractContent = contractContent.replace(
            new RegExp(`contract\\s+${originalContractName}`, 'g'),
            `contract ${uniqueContractName}`
        );

        // Write the modified content to a temporary file in the contracts directory
        const contractsDir = path.join(__dirname, 'contracts');
        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir);
        }
        const tempFilePath = path.join(contractsDir, `${uniqueContractName}.sol`);
        fs.writeFileSync(tempFilePath, contractContent);

        // Run the CLI tool
        await new Promise((resolve, reject) => {
            exec(`CONTRACT_PATH=${tempFilePath} npm run scan`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    reject(error);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                resolve();
            });
        });

        // Read the output.json file
        const outputPath = path.join(__dirname, 'output.json');
        const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);

        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during scanning: ' + error.message);
    }
});

app.post('/clear', (req, res) => {
    const outputPath = path.join(__dirname, 'output.json');
    fs.writeFile(outputPath, '{}', (err) => {
        if (err) {
            console.error('Error clearing output.json:', err);
            res.status(500).send('An error occurred while clearing results.');
        } else {
            res.sendStatus(200);
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
