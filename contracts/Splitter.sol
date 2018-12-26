pragma solidity 0.4.24;

contract Splitter {
    address public owner;
    mapping (bytes32 => address) accounts;

    constructor(address Alice, address Bob, address Carol) public {
        owner = msg.sender;
        accounts["Alice"] = Alice;
        emit accountAdded("Alice", Alice);
        accounts["Bob"] = Bob;
        emit accountAdded("Bob", Bob);
        accounts["Carol"] = Carol;
        emit accountAdded("Carol", Carol);
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only contract owner can set accounts");
        _;
    }

    event accountAdded(string accountName, address accountAddress);
    event amountSent(uint amount, string accountName, address accountAddress);

    modifier conditionsForSplit(uint amountToSplit) {
        require(msg.sender == accounts["Alice"], "Error: only Alice can split amount");
        require(msg.value == 0, "Error: function does not support msg.value, you need to pass it as parameter");
        require(amountToSplit > 0, "Error: you need to provide a value");
        require(amountToSplit % 2 == 0, "Error: only even numbers acceptable");
        _;
    }
        
    function splitAmount(uint amountToSplit) public payable conditionsForSplit(amountToSplit) {
        //in case Bob or Carol reject transfer, every state change should be reverted
        uint amountToSend = amountToSplit/2;
        accounts["Bob"].transfer(amountToSend);
        emit amountSent(amountToSend, "Bob", accounts["Bob"]);
        accounts["Carol"].transfer(amountToSend);
        emit amountSent(amountToSend, "Carol", accounts["Carol"]);
    }
    
    function() external payable {
    }
}
