import React, { useState } from "react";
import web3 from "./web3"; // You'll have to setup web3.js in your project
import { abi, bytecode } from "C:\Users\vinee\OneDrive\Desktop\New folder\Cryptocurrency\v6.0\artifacts\contracts\BasicDutchAuction.sol\BasicDutchAuction.json";


function Deploy() {
  const [reservePrice, setReservePrice] = useState("");
  const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] = useState("");
  const [offerPriceDecrement, setOfferPriceDecrement] = useState("");
  const [deployedContractAddress, setDeployedContractAddress] = useState("");

  const deployContract = async () => {
    // Todo: Instantiate your contract and deploy it
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(abi, bytecode);

    contract.deploy({
      data: bytecode,
      arguments: [reservePrice, numBlocksAuctionOpen, offerPriceDecrement]
    }).send({
      from: accounts[0]
    }).then((newContractInstance) => {
      setDeployedContractAddress(newContractInstance.options.address);
    });
  }

  return (
    <div>
      <input type="text" onChange={(e) => setReservePrice(e.target.value)} placeholder="Reserve Price" />
      <input type="text" onChange={(e) => setNumBlocksAuctionOpen(e.target.value)} placeholder="Number of Blocks Auction is Open" />
      <input type="text" onChange={(e) => setOfferPriceDecrement(e.target.value)} placeholder="Offer Price Decrement" />
      <button onClick={deployContract}>Deploy</button>
      <p>{deployedContractAddress}</p>
    </div>
  );
}

export default Deploy;
