// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTDutchAuction is ERC721, ReentrancyGuard, Ownable {
    uint public reservePrice;
    uint public numBlocksAuctionOpen;
    uint public offerPriceDecrement;
    uint public initialPrice;
    uint public startBlock;
    bool public ended;
    address payable public highestBidder;
    uint public highestBid;
    mapping(address => uint) public refunds;

    uint256 private _nftTokenId;

    constructor(
        string memory name,
        string memory symbol,
        uint256 nftTokenId,
        uint _reservePrice,
        uint _numBlocksAuctionOpen,
        uint _offerPriceDecrement
    ) ERC721(name, symbol) {
        _nftTokenId = nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
        startBlock = block.number;
        ended = false;
    }

    function bid() public payable {
        require(block.number <= startBlock + numBlocksAuctionOpen, "Auction is already closed.");
        
        require(msg.value >= currentPrice(), "Bid is not high enough.");

        if(highestBidder != address(0)) {
            refunds[highestBidder] += highestBid;  // Refund the previous highest bid
        }

        highestBid = msg.value;  // Save the new highest bid
        highestBidder = payable(msg.sender);

        // Don't end the auction if the reserve price is met
        if(block.number >= startBlock + numBlocksAuctionOpen) {
            ended = true;  // End the auction if the time has passed
            payable(owner()).transfer(msg.value);
        }
    }

    function withdraw() public {
        uint refundAmount = refunds[msg.sender];
        require(refundAmount > 0, "No refund available");
        refunds[msg.sender] = 0;
        payable(msg.sender).transfer(refundAmount);
    }

    function currentPrice() public view returns (uint) {
        uint blocksPassed = block.number - startBlock;
        if (blocksPassed >= numBlocksAuctionOpen) {
            return reservePrice;
        } else {
            return initialPrice - blocksPassed * offerPriceDecrement;
        }
    }

    // Function to end the auction manually (by the owner)
    function endAuction() public {
        require(msg.sender == owner(), "Only the owner can end the auction");
        require(!ended, "The auction is already ended");
        ended = true;
        payable(owner()).transfer(highestBid); // transfer highest bid to owner
    }
}
