pragma solidity 0.4.15;


contract AbstractLockedAddress {
//    function setLockedAddressInternal(address _address, bool _lock) internal;
    function isAddressLocked(address _address) public constant returns(bool);
}