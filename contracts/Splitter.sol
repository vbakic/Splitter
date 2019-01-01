pragma solidity 0.4.24;

import "./SafeMath.sol";

contract Ownable {

    address public owner;

    event LogChangeOwner(address indexed newOwner, address indexed oldOwner);

    modifier onlyOwner {
        require(msg.sender == owner, "Error: only owner is allowed to do that");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function changeOwner(address newOwner) public onlyOwner returns (bool) {
        require(newOwner != owner, "Error: already that owner");
        emit LogChangeOwner(newOwner, msg.sender);
        owner = newOwner;
        return true;
    }

}

contract Pausable is Ownable {

    bool public isRunning;

    event LogPauseContract(address indexed accountAddress);
    event LogResumeContract(address indexed accountAddress);

    modifier onlyIfRunning {
        require(isRunning, "Error: contract paused");
        _;
    }

    constructor() public {
        isRunning = true;
    }

    function pauseContract() public onlyIfRunning onlyOwner returns(bool) {
        emit LogPauseContract(msg.sender);
        isRunning = false;
        return true;
    }

    function resumeContract() public onlyOwner returns(bool) {
        require(isRunning == false, "Error: contract already running");
        emit LogResumeContract(msg.sender);
        isRunning = true;
        return true;
    }
}

contract Splitter is Pausable {

    using SafeMath for uint;
    mapping (address => uint) public balances;
    
    event LogSplitEther(address indexed sender, address indexed receiver1, address indexed receiver2, uint amountToSplit);
    event LogWithdrawEther(address indexed accountAddress, uint transferredAmount);    
        
    function splitEther(address receiver1, address receiver2) public payable onlyIfRunning returns(bool) {        
        require(receiver1 != address(0), "Error: first parameter is invalid address");
        require(receiver2 != address(0), "Error: second parameter is invalid address");
        emit LogSplitEther(msg.sender, receiver1, receiver2, msg.value);
        uint amountToAdd = msg.value/2;
        if(msg.value % 2 == 1) balances[msg.sender] = balances[msg.sender].add(1);
        balances[receiver1] = balances[receiver1].add(amountToAdd);
        balances[receiver2] = balances[receiver2].add(amountToAdd);
        return true;
    }

    function withdrawEther(uint amount) public payable onlyIfRunning returns(bool) {
        require(amount != 0, "Error: amount cannot be zero");
        uint balance = balances[msg.sender];
        require(amount <= balance, "Error: you asked for nonexisting funds");
        emit LogWithdrawEther(msg.sender, amount);
        balances[msg.sender] = balances[msg.sender].sub(amount);
        msg.sender.transfer(amount);
        return true;
    }
    
}
