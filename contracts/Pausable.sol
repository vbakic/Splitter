pragma solidity 0.4.24;

import "./Ownable.sol";

contract Pausable is Ownable {

    bool public isRunning;
    bool public isAlive;

    event LogPauseContract(address indexed accountAddress);
    event LogResumeContract(address indexed accountAddress);
    event LogKillContract(address indexed accountAddress);

    modifier onlyIfRunning {
        require(isRunning, "Error: contract paused");
        _;
    }

    modifier onlyIfPaused {
        require(isRunning == false, "Error: contract not paused");
        require(isAlive, "Error: contract already killed");
        _;
    }

    constructor() public {
        isRunning = true;
        isAlive = true;
    }

    function pauseContract() public onlyIfRunning onlyOwner returns(bool) {
        emit LogPauseContract(msg.sender);
        isRunning = false;
        return true;
    }

    function resumeContract() public onlyOwner onlyIfPaused returns(bool) {
        emit LogResumeContract(msg.sender);
        isRunning = true;
        return true;
    }

    function killContract() public onlyOwner onlyIfPaused returns (bool) {
        isAlive = false;
        return true;
    }

}