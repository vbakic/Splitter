pragma solidity 0.4.24;

contract Splitter {

    mapping (address => uint) public balances;

    event balanceUpdated(address indexed accountAddress, uint balanceToAdd);
    event etherTransferred(address indexed accountAddress, uint transferredAmount);
        
    function splitAmount(address receiver1, address receiver2) public payable returns(bool) {
        require(receiver1 != address(0), "Error: first parameter is invalid address");
        require(receiver2 != address(0), "Error: second parameter is invalid address");
        uint amountToAdd = msg.value/2;
        uint amountToGiveBack = msg.value - amountToAdd*2;
        if(amountToGiveBack == 1) {
            balances[msg.sender] += amountToGiveBack;
            emit balanceUpdated(msg.sender, amountToGiveBack);
        }
        balances[receiver1] += amountToAdd;
        emit balanceUpdated(receiver1, amountToAdd);
        balances[receiver2] += amountToAdd;
        emit balanceUpdated(receiver2, amountToAdd);
        return true;
    }

    function pullEther(uint amount) public returns(bool) {
        require(amount > 0, "Error: amount must be greater than zero");
        uint balance = balances[msg.sender];
        require(amount <= balance, "Error: you asked for nonexisting funds");
        balances[msg.sender] -= amount;
        msg.sender.transfer(amount);
        emit etherTransferred(msg.sender, amount);
        return true;
    }
    
}
