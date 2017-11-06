pragma solidity 0.4.15;


contract AbstractLockedAddress {
    function isAddressLocked(address _address) public constant returns(bool);
}