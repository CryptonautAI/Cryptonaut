pragma solidity 0.4.15;

import "./Ownable.sol";
import "./AbstractLockedAddress.sol";


contract Multivest is Ownable {
    /* public variables */
    mapping(address => bool) public allowedMultivests;
    mapping(address => uint256) public allowedContributors;

    /* events */
    event MultivestSet(address multivest);
    event MultivestUnset(address multivest);

//    AbstractLockedAddress public lockedAddress;

    modifier onlyMultivests(address _addresss) {
        require(allowedMultivests[_addresss] == true);
        _;
    }

    /* constructor */
    function Multivest(address multivest) {
        allowedMultivests[multivest] = true;
    }

//    function setLockedAddress(AbstractLockedAddress value) onlyOwner {
//        lockedAddress = value;
//    }

    /* public methods */
    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
    }

    function buy(address _address, uint256 value) internal returns (bool);

    function acceptMultivestBuy(address _address, uint256 value) public onlyMultivests(msg.sender) {
        allowedContributors[_address] = value;
    }

//    function burn(address _address) public onlyOwner {
//        require(lockedAddress.isAddressLocked(_address));
//        allowedContributors[_address] = 0;
//    }

    function multivestBuy(bytes32 hash, uint8 v, bytes32 r, bytes32 s, bool locked) public payable onlyMultivests(verify(hash, v, r, s)) {
        require(hash == sha3(msg.sender, locked));
        require(allowedContributors[msg.sender] >= msg.value);

//        if (locked == true) {
//            lockedAddress.setLockedAddress(msg.sender, true);
//        }

        bool status = buy(msg.sender, msg.value);

        require(status == true);
    }

    function verify(bytes32 hash, uint8 v, bytes32 r, bytes32 s) internal returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        return ecrecover(sha3(prefix, hash), v, r, s);
    }
}