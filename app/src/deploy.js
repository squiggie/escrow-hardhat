import { ethers } from 'ethers';
import EscrowFactory from './artifacts/contracts/Escrow.sol/EscrowFactory';

const factoryAddress = "0x56e0bf57df8188c0d4913bb4fe1491ff61de658a";

export default async function deploy(signer, arbiter, beneficiary, value) {
  const factoryContract = new ethers.Contract(factoryAddress, EscrowFactory.abi, signer);
  
  // Call the createEscrow function of the factory contract
  const valueInWei = ethers.utils.parseEther(value,"ether");
  const txResponse  = factoryContract.createEscrow(arbiter, beneficiary, { value: valueInWei });
  
  // Wait for the transaction to be mined
  const receipt = await txResponse.wait();

  // Find the EscrowCreated event in the transaction receipt
  const escrowCreatedEvent = receipt.events.find(event => event.event === 'EscrowCreated');
  if (!escrowCreatedEvent) throw new Error("EscrowCreated event not found");

  const [creator, escrowAddress] = escrowCreatedEvent.args;
  return escrowAddress; // This is the address of the newly deployed Escrow contract
}

