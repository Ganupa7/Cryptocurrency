// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract MyNFT is ERC721Upgradeable {
    uint256 public tokenCounter;

    function initialize(string memory name, string memory symbol) public initializer {
        __ERC721_init(name, symbol);
        tokenCounter = 0;
    }

    function createCollectible() public returns (uint256) {
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        tokenCounter = tokenCounter + 1;
        return newItemId;
    }
}

