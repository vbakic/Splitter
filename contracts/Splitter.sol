pragma solidity 0.4.24;

contract Splitter {

    address public owner;
    mapping (address => uint) accounts;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only contract owner can set accounts");
        _;
    }

    event accountAdded(string accountName, address accountAddress);
    event amountSent(uint amount, string accountName, address accountAddress);

    modifier conditionsForSplit(uint amountToSplit) {
        require(amountToSplit > 0, "Error: you need to provide a value");
        _;
    }
        
    function splitAmount(address receiver1, address receiver2, uint amountToSplit) public conditionsForSplit(amountToSplit) returns(bool) {
        require(receiver1 != address(0), "Error: first parameter is invalid address");
        require(receiver2 != address(0), "Error: second parameter is invalid address");
        uint amountToSend = amountToSplit/2;
        accounts[receiver1] += amountToSend;
        accounts[receiver2] += amountToSend;
        return true;
    }

    function pullEther() public payable returns(bool) {
        msg.sender.transfer(accounts[msg.sender]);
        accounts[msg.sender] = 0;
        return true;
    }
    
    function() public payable {
    }
}
