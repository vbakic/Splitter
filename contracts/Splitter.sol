pragma solidity 0.4.24;

contract Splitter {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    modifier conditionsForSplit(uint amountToSplit) {
        require(msg.value == 0, "Error: function does not support msg.value, you need to pass it as parameter");
        require(amountToSplit > 0, "Error: you need to provide a value");        
        require(amountToSplit % 2 == 0, "Error: only even numbers acceptable");
        _;
    }
        
    function splitAmount(address Bob, address Carol, uint amountToSplit) public payable conditionsForSplit(amountToSplit) {
        Bob.transfer(amountToSplit/2);
        Carol.transfer(amountToSplit/2);
    }
    
    function() external payable {
    }
}
