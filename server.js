const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { scan } = require('./src/scanner');
const hre = require("hardhat");

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('.'));

app.post('/scan', upload.single('contract'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Read the content of the uploaded file
        const contractContent = fs.readFileSync(req.file.path, 'utf8');

        // Write the content to a temporary file in the contracts directory
        const contractsDir = path.join(__dirname, 'contracts');
        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir);
        }
        const tempContractPath = path.join(contractsDir, `temp_${Date.now()}.sol`);
        fs.writeFileSync(tempContractPath, contractContent);

        // Compile the contract
        await hre.run('compile');

        // Run the scan
        const result = await scan(tempContractPath);

        // Clean up the temporary file in the contracts directory
        fs.unlinkSync(tempContractPath);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during scanning.');
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
