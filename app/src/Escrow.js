import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import EscrowContract from './artifacts/contracts/Escrow.sol/Escrow.json'; // Import ABI

export default function Escrow({
  address,
  signer,
  provider,
  isApproved
}) {
  const [arbiter, setArbiter] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContractDetails = async () => {
      const contract = new ethers.Contract(address, EscrowContract.abi, provider);
      const arbiter = await contract.arbiter();
      const beneficiary = await contract.beneficiary();
      const value = await provider.getBalance(address);

      console.log(contract.address + ' has a value of ' + value)
      setArbiter(arbiter);
      setBeneficiary(beneficiary);
      setValue(ethers.utils.formatEther(value));
      setIsLoading(false);
    };

    if (address) {
      fetchContractDetails();
    }
  }, [address, provider]);

  if (isLoading) {
    return <div>Loading contract details...</div>;
  }

  async function checkIfApproved(escrowAddress, provider) {
    const escrowContract = new ethers.Contract(escrowAddress, EscrowContract.abi, provider);
    const filter = escrowContract.filters.Approved();
    const events = await escrowContract.queryFilter(filter);
  
    return events.length > 0; // If there are any events, the contract has been approved
  }

  async function fetchAndMarkApprovedContracts(escrows, provider) {
    const updatedEscrows = await Promise.all(escrows.map(async (escrow) => {
      const isApproved = await checkIfApproved(escrow.address, provider);
      return { ...escrow, isApproved };
    }));
  
    return updatedEscrows;
  }
  

  
  async function handleApprove() {
    const currentUserAddress = await signer.getAddress();
    if (currentUserAddress === arbiter){
      const escrowContract = new ethers.Contract(address, EscrowContract.abi, signer);

      escrowContract.on('Approved', () => {
        document.getElementById(escrowContract.address).className =
          'complete';
        document.getElementById(escrowContract.address).innerText =
          "✓ It's been approved!";
      });

      try {
        const approveTxn = await escrowContract.approve();
        await approveTxn.wait();
      } catch (error) {
        console.error("Failed to approve:", error);
      }
    } else {
      alert("Only the arbiter can approve this transaction.");
    }
  }

  return (
    <div className="existing-contract">
      <ul className="fields">
        <li>
          <div> Arbiter </div>
          <div> {arbiter} </div>
        </li>
        <li>
          <div> Beneficiary </div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value (in ETH)</div>
          <div> {value.toString()} </div>
        </li>
        <li>
          <div> Status </div>
          <div> {isApproved ? "Approved" : "Pending"} </div>
        </li>
        {isApproved ? (
          <div className="approved-box">
            Approved
          </div>
        ) : (
          <div
            className="button"
            id={address}
            onClick={handleApprove}>
            Approve
          </div>
        )}
      </ul>
    </div>
  );
}
