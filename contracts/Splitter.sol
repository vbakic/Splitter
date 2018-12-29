pragma solidity 0.4.24;

contract Splitter {

    mapping (address => uint) public balances;

    event LogSplitEther(address indexed sender, address indexed receiver1, address indexed receiver2, uint amountToSplit);
    event LogWithdrawEther(address indexed accountAddress, uint transferredAmount);
        
    function splitEther(address receiver1, address receiver2) public payable returns(bool) {        
        require(receiver1 != address(0), "Error: first parameter is invalid address");
        require(receiver2 != address(0), "Error: second parameter is invalid address");
        emit LogSplitEther(msg.sender, receiver1, receiver2, msg.value);
        if(msg.value % 2 == 1) balances[msg.sender]++;
        balances[receiver1] += msg.value/2;
        balances[receiver2] += msg.value/2;
        return true;
    }

    function withdrawEther(uint amount) public payable returns(bool) {
        require(amount > 0, "Error: amount must be greater than zero");
        uint balance = balances[msg.sender];
        require(amount <= balance, "Error: you asked for nonexisting funds");
        emit LogWithdrawEther(msg.sender, amount);
        balances[msg.sender] -= amount;        
        msg.sender.transfer(amount);        
        return true;
    }
    
}
