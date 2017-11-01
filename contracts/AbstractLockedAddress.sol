pragma solidity 0.4.15;


contract AbstractLockedAddress {
    function setLockedAddress(address _address, bool _lock);
    function isAddressLocked(address _address) public constant returns(bool);
}