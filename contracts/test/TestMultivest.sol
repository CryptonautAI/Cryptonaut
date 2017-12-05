pragma solidity ^0.4.13;

import '../Multivest.sol';
import '../ERC20.sol';

contract TestMultivest is Multivest, ERC20 {
    function TestMultivest(address allowedMultivest)
        ERC20(
            1000000,
            "TEST",
            18,
            "TST",
            false,
            false
        )
        Multivest(allowedMultivest)
    {
        standard = "TestMultivest 0.1";
    }

    function buy(address _address, uint256 value, bool _locked) internal returns (bool) {
        _locked = _locked;
        return transferInternal(this, _address, value);
    }
    function increaseCollectedEthers(uint256 _value) internal returns (bool) {
        _value = _value;
        return true;
    }
}