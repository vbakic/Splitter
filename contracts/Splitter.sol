pragma solidity 0.4.25;

import "./Pausable.sol";
import "./SafeMath.sol";

contract Splitter is Pausable {

    using SafeMath for uint;
    mapping (address => uint) public balances;
    
    event LogSplitEther(address indexed caller, address indexed receiver1, address indexed receiver2, uint amountToSplit);
    event LogWithdrawEther(address indexed caller, uint transferredAmount);    
        
    constructor(uint8 initialState) public Pausable(initialState) {}

    function splitEther(address receiver1, address receiver2) public payable onlyIfRunning returns(bool) {
        require(msg.value != 0, "Error: amount cannot be zero");
        require(receiver1 != address(0), "Error: first parameter is invalid address");
        require(receiver2 != address(0), "Error: second parameter is invalid address");
        require(receiver1 != msg.sender, "Error: first parameter is sender address");
        require(receiver2 != msg.sender, "Error: second parameter is sender address");
        emit LogSplitEther(msg.sender, receiver1, receiver2, msg.value);
        uint amountToAdd = msg.value/2;
        if(msg.value % 2 == 1) balances[msg.sender] = balances[msg.sender].add(1);
        balances[receiver1] = balances[receiver1].add(amountToAdd);
        balances[receiver2] = balances[receiver2].add(amountToAdd);
        return true;
    }

    function withdrawEther(uint amount) public payable onlyIfAlive returns(bool) {
        require(amount != 0, "Error: amount cannot be zero");
        uint balance = balances[msg.sender];
        require(amount <= balance, "Error: you asked for nonexisting funds");
        emit LogWithdrawEther(msg.sender, amount);
        balances[msg.sender] = balances[msg.sender].sub(amount);
        msg.sender.transfer(amount);
        return true;
    }
    
}
