pragma solidity 0.4.24;

contract Splitter {

    mapping (address => uint) accounts;
        
    function splitAmount(address receiver1, address receiver2) public payable returns(bool) {
        require(receiver1 != address(0), "Error: first parameter is invalid address");
        require(receiver2 != address(0), "Error: second parameter is invalid address");
        uint amountToSend = msg.value/2;
        accounts[receiver1] += amountToSend;
        accounts[receiver2] += amountToSend;
        return true;
    }

    function getContractBalance() public view returns (uint) {
        return accounts[msg.sender];
    }

    function pullEther(uint amount) public returns(bool) {
        uint balance = accounts[msg.sender];
        if(amount <= balance) {
            bool result = Splitter.pullEtherTransaction(amount);
            require (result == true, "Error: pull ether failed");
            accounts[msg.sender] -= amount;
            return true;
        } else {
            return false;
        }        
    }

    function pullEtherTransaction(uint amount) public payable returns(bool) {
        msg.sender.transfer(amount);
        return true; //it will return true only if successful, then we can set its contract balance to 0
    }
    
}
