pragma solidity 0.4.24;

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
        require(newOwner != address(0), "Error: invalid address of owner");
        emit LogChangeOwner(newOwner, msg.sender);
        owner = newOwner;
        return true;
    }

}