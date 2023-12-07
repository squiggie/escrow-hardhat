// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
	event Approved(uint);

	address public arbiter;
	address public beneficiary;
	address public depositor;

	bool public isApproved;

	constructor(address _arbiter, address _beneficiary) payable {
		arbiter = _arbiter;
		beneficiary = _beneficiary;
		depositor = msg.sender;
	}

	function approve() external {
		require(msg.sender == arbiter);
		uint balance = address(this).balance;
		(bool sent, ) = payable(beneficiary).call{value: balance}("");
 		require(sent, "Failed to send Ether");
		emit Approved(balance);
		isApproved = true;
	}
}

contract EscrowFactory {
    event EscrowCreated(address indexed creator, address escrowAddress);

    function createEscrow(address arbiter, address beneficiary) public payable {
        Escrow newEscrow = new Escrow(arbiter, beneficiary);
        emit EscrowCreated(msg.sender, address(newEscrow));
    }
}
