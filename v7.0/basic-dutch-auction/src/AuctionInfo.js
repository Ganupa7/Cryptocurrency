import React, { useState } from "react";
import web3 from "./web3";
import { abi, bytecode } from "C:\Users\vinee\OneDrive\Desktop\New folder\Cryptocurrency\v6.0\artifacts\contracts\BasicDutchAuction.sol\BasicDutchAuction.json";


function AuctionInfo() {
  const [address, setAddress] = useState("");
  const [winner, setWinner] = useState("");
  const [parameters, setParameters] = useState({});
  const [currentPrice, setCurrentPrice] = useState("");

  const getInfo = async () => {
    const contract = new web3.eth.Contract(abi, address);
    // Get the winner, parameters and current price and set the state
    // This will depend on the methods exposed by your contract
  }

  return (
    <div>
      <input type="text" onChange={(e) => setAddress(e.target.value)} placeholder="Auction Address" />
      <button onClick={getInfo}>Show Info</button>
      <p>Winner: {winner}</p>
      <p>Parameters: {JSON.stringify(parameters)}</p>
      <p>Current Price: {currentPrice}</p>
    </div>
  );
}

export default AuctionInfo;
