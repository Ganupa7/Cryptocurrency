// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;


import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MyToken.sol";


contract NFTDutchAuction_ERC20Bids is ReentrancyGuard, Ownable {
    ERC721 public erc721Token;
    MyToken public erc20Token;
    

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

    constructor (
    address erc20TokenAddress,
    address erc721TokenAddress,
    uint256 nftTokenId,
    uint _reservePrice,
    uint _numBlocksAuctionOpen,
    uint _offerPriceDecrement
    ) 
      {
  

    erc721Token = ERC721(erc721TokenAddress);
    erc20Token = MyToken(erc20TokenAddress);

    _nftTokenId = nftTokenId;
    reservePrice = _reservePrice;
    numBlocksAuctionOpen = _numBlocksAuctionOpen;
    offerPriceDecrement = _offerPriceDecrement;
    initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
    startBlock = block.number;
    ended = false;
}

    
    
    function bid(uint256 bidAmount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public {
        // permit needs owner, spender, value, deadline, v, r, s
        // owner is msg.sender, spender is this contract
        // value is bidAmount, deadline, v, r, s are given in the function arguments
        erc20Token.permit(msg.sender, address(this), bidAmount, deadline, v, r, s);
        // Then call the normal bid function
        _bid(bidAmount);
    }

    function _bid(uint256 bidAmount) internal {
        //require(block.number <= startBlock + numBlocksAuctionOpen, "Auction is already closed.");
        require(bidAmount >= currentPrice(), "Bid is not high enough.");

        // Transfer the tokens to this contract
        erc20Token.transferFrom(msg.sender, address(this), bidAmount);

        if (highestBidder != address(0)) {
            refunds[highestBidder] += highestBid; // Refund the previous highest bid
        }

        highestBid = bidAmount; // Save the new highest bid
        highestBidder = msg.sender;

        // Don't end the auction if the reserve price is met
        if (block.number >= startBlock + numBlocksAuctionOpen) {
            ended = true; // End the auction if the time has passed
            erc20Token.transfer(owner(), highestBid);
        }
    }

    function withdraw() public {
        uint refundAmount = refunds[msg.sender];
        require(refundAmount > 0, "No refund available");
        refunds[msg.sender] = 0;
        erc20Token.transfer(msg.sender, refundAmount);
    }

    function getNftTokenId() public view returns (uint256) {
        return _nftTokenId;
    }

    function currentPrice() public view returns (uint) {
        uint blocksPassed = block.number - startBlock;
        if (blocksPassed >= numBlocksAuctionOpen) {
            return reservePrice;
        }
        return initialPrice - blocksPassed * offerPriceDecrement;
    }

    function endAuction() public onlyOwner {
        require(!ended, "The auction is already ended");
        ended = true;
        if (highestBidder != address(0)) {
            erc721Token.transferFrom(owner(), highestBidder, _nftTokenId);
            erc20Token.transfer(owner(), highestBid);
        }
    }

   
}