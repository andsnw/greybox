// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Overflow {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public withdrawalUnlockTime;

    // Allows anyone to deposit ETH and set a lock time
    function depositFunds() external payable {
        // Vulnerability: Potential integer overflow in unchecked block
        unchecked {
            accountBalances[msg.sender] += msg.value;
        }
        withdrawalUnlockTime[msg.sender] = block.timestamp + 1 weeks;
    }

    // Vulnerability: Potential integer overflow, the user could pass a very large value causing overflow
    function extendLockTime(uint256 _additionalSeconds) public {
        unchecked {
            withdrawalUnlockTime[msg.sender] += _additionalSeconds;
        }
    }

    // Allows withdrawals only if the current time is greater than the lock time
    function releaseFunds() public {
        require(accountBalances[msg.sender] > 0, "Insufficient funds");
        require(block.timestamp > withdrawalUnlockTime[msg.sender], "Lock time not expired");

        uint256 withdrawalAmount = accountBalances[msg.sender];
        accountBalances[msg.sender] = 0;

        (bool successfulWithdrawal,) = msg.sender.call{value: withdrawalAmount}("");
        require(successfulWithdrawal, "Failed to send Ether");
    }

    // Vulnerability: Potential integer overflow in unchecked block
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        unchecked {
            return a + b;
        }
    }

    // Vulnerability: Potential integer underflow in unchecked block
    function subtract(uint256 a, uint256 b) public pure returns (uint256) {
        unchecked {
            return a - b;
        }
    }
}