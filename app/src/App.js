import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import EscrowFactory from './artifacts/contracts/Escrow.sol/EscrowFactory.json';
import EscrowContract from './artifacts/contracts/Escrow.sol/Escrow.json';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const factoryAddress = "0x56e0bf57df8188c0d4913bb4fe1491ff61de658a";

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

async function getDeployedEscrows(factoryAddress, userAddress) {
  const factoryContract = new ethers.Contract(factoryAddress, EscrowFactory.abi, provider);
  const filter = factoryContract.filters.EscrowCreated(userAddress);
  const events = await factoryContract.queryFilter(filter);

  return events.map(event => event.args.escrowAddress);
}

async function fetchAndMarkApprovedContracts(escrowAddresses) {
  return Promise.all(escrowAddresses.map(async (address) => {
    const isApproved = await checkIfApproved(address);
    return { address, isApproved };
  }));
}

async function checkIfApproved(escrowAddress) {
  const escrowContract = new ethers.Contract(escrowAddress, EscrowContract.abi, provider);
  const filter = escrowContract.filters.Approved();
  const events = await escrowContract.queryFilter(filter);

  return events.length > 0; // If there are any events, the contract has been approved
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log('Please connect to MetaMask.');
      } else {
        setAccount(accounts[0]);
      }
    };

    async function loadDeployedContracts() {
      if (account) {
        const deployedContracts = await getDeployedEscrows(factoryAddress, account);
        // Update the state with the deployed contracts
        //setEscrows(deployedContracts.map(address => ({ address })));
        const escrowsWithApproval = await fetchAndMarkApprovedContracts(deployedContracts);
        setEscrows(escrowsWithApproval);
      }
    }

    provider.on('accountsChanged', handleAccountsChanged);
    getAccounts();
    loadDeployedContracts();


    // Clean up the event listener when the component unmounts
    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [account]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = document.getElementById('eth').value;
    const newContractAddress = await deploy(signer, arbiter, beneficiary, value);
    const escrowContract = new ethers.Contract(newContractAddress, EscrowContract, signer);

    const escrow = {
      address: newContractAddress,
      arbiter,
      beneficiary,
      value: value,
    };
    setEscrows([...escrows, escrow]);
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Eth)
          <input type="text" id="eth" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} address={escrow.address} provider={provider} signer={signer} isApproved={escrow.isApproved}/>;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
