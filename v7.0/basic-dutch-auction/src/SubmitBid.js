import React, { useState } from "react";
import web3 from "./web3";
import { abi, bytecode } from "C:\Users\vinee\OneDrive\Desktop\New folder\Cryptocurrency\v6.0\artifacts\contracts\BasicDutchAuction.sol\BasicDutchAuction.json";


function SubmitBid() {
  const [address, setAddress] = useState("");
  const [bid, setBid] = useState("");
  const [message, setMessage] = useState("");

  const submitBid = async () => {
    const contract = new web3.eth.Contract(abi, address);
    const accounts = await web3.eth.getAccounts();

    contract.methods.bid().send({ from: accounts[0], value: web3.utils.toWei(bid, 'ether') })
      .then(() => setMessage("Bid accepted"))
      .catch(() => setMessage("Bid rejected"));
  }

  return (
    <div>
      <input type="text" onChange={(e) => setAddress(e.target.value)} placeholder="Auction Address" />
      <input type="text" onChange={(e) => setBid(e.target.value)} placeholder="Bid" />
      <button onClick={submitBid}>Bid</button>
      <p>{message}</p>
    </div>
  );
}

export default SubmitBid;
