# Greybox - DAST Framework for Ethereum Smart Contracts (EthSydney Hackathon 2024)

Greybox is a Dynamic Application Security Testing (DAST) framework for Ethereum smart contracts, inspired by the Nuclei framework.

## How It Works

Greybox scans Solidity smart contracts for vulnerabilities by performing static & dynamic analysis.

Templates can be created by the user in the `templates` folder in yaml formats.

Upon execution, Greybox performs the following steps:

1. **Static Analysis**: Scans the contract code for potential vulnerability patterns using predefined YAML templates.

2. **Dynamic Testing**: Deploys the contract to a local Hardhat network and executes test functions to verify vulnerabilities.

3. **Result Compilation**: Combines static and dynamic results, filtering for confirmed vulnerabilities.

The framework uses a modular approach with YAML templates for easy addition of new vulnerability checks. It leverages Hardhat for contract deployment and testing, providing a robust environment for dynamic analysis.

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   pnpm install
   ```

## Usage

### Web UI

A web UI for this repo is provided. Currently, it only supports local viewing on the same host machine that runs the Greybox framework.

To run the web-based user interface:

1. Start the server:
   ```
   npm start
   ```

2. Open a web browser and navigate to `http://localhost:3000`

3. Use the "Upload Contract" button to select and scan a Solidity contract file.

4. The web UI will display the contract code with highlighted vulnerable lines and detailed vulnerability information below.

### CLI

To run the scanner from the command line:

```
CONTRACT_PATH=<path_to_contract> npm run scan
```

Replace `<path_to_contract>` with the local file path to the contract you want to scan.

### Options

- `CONTRACT_PATH`: Specifies the path to the Solidity contract file to be scanned.

## Output

After the scan completes, results of vulnerabilities will be saved in the `output.json` file. This file contains detailed information about any detected vulnerabilities, including:

- Vulnerability name and description
- Severity level
- Affected code and line numbers
- Test type (Static or Dynamic)
- Mitigation suggestions

## Adding New Vulnerability Checks

To add a new vulnerability check:

1. Create a new YAML file in the `templates` directory.
2. Define the vulnerability patterns, description, and test functions in the YAML file. You can use the existing templates as a reference.
3. The scanner will automatically pick up and use the new template in subsequent scans.
