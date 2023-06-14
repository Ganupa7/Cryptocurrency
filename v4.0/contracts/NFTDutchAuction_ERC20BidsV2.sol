// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NFTDutchAuction_ERC20BidsV2 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    ERC721 public erc721Token;
    ERC20 public erc20Token;
    

    uint public reservePrice;
    uint public numBlocksAuctionOpen;
    uint public offerPriceDecrement;
    uint public initialPrice;
    uint public startBlock;
    bool public ended;
    address public highestBidder;
    uint public highestBid;
    mapping(address => uint) public refunds;

    uint256 private _nftTokenId;

    function initialize(
    address erc20TokenAddress,
    address erc721TokenAddress,
    uint256 nftTokenId,
    uint _reservePrice,
    uint _numBlocksAuctionOpen,
    uint _offerPriceDecrement
    ) 
    public initializer {
    __ReentrancyGuard_init();
    __Ownable_init();

    erc721Token = ERC721(erc721TokenAddress);
    erc20Token = ERC20(erc20TokenAddress);

    _nftTokenId = nftTokenId;
    reservePrice = _reservePrice;
    numBlocksAuctionOpen = _numBlocksAuctionOpen;
    offerPriceDecrement = _offerPriceDecrement;
    initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
    startBlock = block.number;
    ended = false;
}

    function newFunction() public pure returns (string memory) {
        return "This is a new function in V2";
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "NFTDutchAuction_ERC20Bids: zero address given for new implementation");
    }
}
