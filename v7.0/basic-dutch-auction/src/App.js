import React, { useState } from 'react';
import { ethers } from "ethers";
import contractArtifact from './BasicDutchAuction.json';
import './App.css';


// contractAddress should be replaced with the deployed contract address
let contractAddress = '0x048398CbfFDB2226F36eb6a77EA5260e7eCC6Eb7';

const provider = new ethers.providers.Web3Provider(window.ethereum);
let contract = new ethers.Contract(contractAddress, contractArtifact.abi, provider);

function App() {
  const [auctionAddress, setAuctionAddress] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] = useState('');
  const [offerPriceDecrement, setOfferPriceDecrement] = useState('');
  const [auctionInfo, setAuctionInfo] = useState(null);
  const [bid, setBid] = useState('');
  const [auctionOutcome, setAuctionOutcome] = useState(null);

  const deployAuction = async () => {
    if (!reservePrice || !numBlocksAuctionOpen || !offerPriceDecrement) return;
    const signer = provider.getSigner();
    const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, signer);
    contract = await factory.deploy(reservePrice, numBlocksAuctionOpen, offerPriceDecrement);
    await contract.deployed();
    contractAddress = contract.address;
    setAuctionAddress(contract.address);
  }

  const fetchAuctionInfo = async () => {
    if (!auctionAddress) return;
    contract = contract.connect(provider);
    const winner = await contract.highestBidder();
    const reservePrice = ethers.utils.formatEther(await contract.reservePrice());
    const numBlocksAuctionOpen = await contract.numBlocksAuctionOpen().then(b => b.toNumber());
    const offerPriceDecrement = ethers.utils.formatEther(await contract.offerPriceDecrement());
    const currentPrice = ethers.utils.formatEther(await contract.currentPrice());
    setAuctionInfo({ winner, reservePrice, numBlocksAuctionOpen, offerPriceDecrement, currentPrice });
  }

  const submitBid = async () => {
    if (!auctionAddress || !bid) return;
    const signer = provider.getSigner();
    contract = contract.connect(signer);
    const tx = await contract.bid({ value: ethers.utils.parseEther(bid) });
    await tx.wait();
    const newWinner = await contract.highestBidder();
    setAuctionOutcome(newWinner === await signer.getAddress() ? 'Your bid won!' : 'Your bid did not win');
  }

  return (
    <div className="App">
      <h1>Basic Dutch Auction</h1>
      <section>
        <h2>Deploy a new auction</h2>
        <input onChange={e => setReservePrice(e.target.value)} type="text" placeholder="Reserve price (in Ether)" />
        <input onChange={e => setNumBlocksAuctionOpen(e.target.value)} type="number" placeholder="Number of blocks the auction is open" />
        <input onChange={e => setOfferPriceDecrement(e.target.value)} type="text" placeholder="Offer price decrement (in Ether)" />
        <button onClick={deployAuction}>Deploy</button>
        {auctionAddress && <p>New auction deployed at {auctionAddress}</p>}
      </section>
      <section>
        <h2>Look up info on an auction</h2>
        <input onChange={e => setAuctionAddress(e.target.value)} type="text" placeholder="Auction address" />
        <button onClick={fetchAuctionInfo}>Get info</button>
        {auctionInfo && <div>
          <p>Winner: {auctionInfo.winner}</p>
          <p>Reserve price: {auctionInfo.reservePrice} Ether</p>
          <p>Number of blocks the auction is open: {auctionInfo.numBlocksAuctionOpen}</p>
          <p>Offer price decrement: {auctionInfo.offerPriceDecrement} Ether</p>
          <p>Current price: {auctionInfo.currentPrice} Ether</p>
        </div>}
      </section>
      <section>
        <h2>Submit a bid</h2>
        <input onChange={e => setBid(e.target.value)} type="text" placeholder="Your bid (in Ether)" />
        <button onClick={submitBid}>Submit bid</button>
        {auctionOutcome && <p>{auctionOutcome}</p>}
      </section>
    </div>
  );
}

export default App;
