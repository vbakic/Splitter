pragma solidity 0.4.24;

contract Splitter {
    address public owner;
    mapping (string => address) accounts;
    bool accountsInitialized = false;

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
        require(accountsInitialized, "Error: accounts need to be initialized first");
        require(msg.sender == accounts["Alice"], "Error: only Alice can split amount");
        require(msg.value == 0, "Error: function does not support msg.value, you need to pass it as parameter");
        require(amountToSplit > 0, "Error: you need to provide a value");
        require(amountToSplit % 2 == 0, "Error: only even numbers acceptable");
        _;
    }

    function checkIfAccountsInitialized() public view returns(bool) {
        return accountsInitialized;
    }

    function initializeAccounts(address Alice, address Bob, address Carol) public onlyOwner returns(bool) {
        require(!accountsInitialized, "Error: accounts already initialized");
        accounts["Alice"] = Alice;
        emit accountAdded("Alice", Alice);
        accounts["Bob"] = Bob;
        emit accountAdded("Bob", Bob);
        accounts["Carol"] = Carol;
        emit accountAdded("Carol", Carol);
        accountsInitialized = true; //probably not the best idea, haven't checked if all accounts have actually been set
        return accountsInitialized;
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
