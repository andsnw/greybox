// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GasLimitVulnerable {
    mapping(address => uint256) public balances;

    function transfer(address _to, uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        for (uint256 i = 0; i < _amount; i++) {  // The loop iterates _amount times, which can be very inefficient and can potentially exceed the block gas limit if _amount is too large.
            balances[msg.sender]--;
            balances[_to]++;
        }
    }
}
