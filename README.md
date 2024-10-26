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

To run the scanner:

```
CONTRACT_PATH=<path_to_contract> npm run scan
```

Replace `<path_to_contract>` with the local file path to the contract you want to scan.

After the scan completes, results of vulnerabilities will be saved in the `output.json` file.