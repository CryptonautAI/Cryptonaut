pragma solidity ^0.4.13;

contract AbstractLockedAddress {
    function setLockedAddress(address _address, bool lock);
    function isAddressLocked(address _address) returns(bool);
}