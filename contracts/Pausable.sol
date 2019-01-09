pragma solidity 0.4.24;

import "./Ownable.sol";

contract Pausable is Ownable {

    enum possibleStates { Running, Paused, Killed }
    possibleStates private State;

    event LogPauseContract(address indexed accountAddress);
    event LogResumeContract(address indexed accountAddress);
    event LogKillContract(address indexed accountAddress);

    modifier onlyIfRunning {
        require(uint(State) == 0, "Error: contract paused or killed");
        _;
    }

    modifier onlyIfPaused {
        require(uint(State) == 1, "Error: contract not paused");
        _;
    }

    constructor() public {
        State = possibleStates.Running;
    }

    function getState() public view returns (uint) {
        return uint(State);
    }

    function pauseContract() public onlyIfRunning onlyOwner returns(bool) {
        emit LogPauseContract(msg.sender);
        State = possibleStates.Paused;
        return true;
    }

    function resumeContract() public onlyOwner onlyIfPaused returns(bool) {
        emit LogResumeContract(msg.sender);
        State = possibleStates.Running;
        return true;
    }

    function killContract() public onlyOwner onlyIfPaused returns (bool) {
        emit LogKillContract(msg.sender);
        State = possibleStates.Killed;
        return true;
    }

}