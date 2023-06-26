// contracts/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyToken is ERC20, ERC20Permit {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
        _mint(msg.sender, initialSupply);
    }
}
