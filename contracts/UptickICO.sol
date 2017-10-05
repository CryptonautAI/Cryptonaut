pragma solidity ^0.4.13;


import './Uptick.sol';

import './Multivest.sol';


contract UptickICO is Uptick, Multivest {

    address public etherHolderAddress;

    uint256 public softCap;

    uint256 public hardCap;

    uint256 public icoSince;

    uint256 public icoTill;

    function UptickICO(
        address _etherHolderAddress,
        address multivestAddress,
        string tokenName,
        string tokenSymbol,
        uint256 totalSupply,
        uint8 precision,
        uint256 tokenPrice,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _icoSince,
        bool _locked
    ) Uptick(totalSupply, tokenName, tokenSymbol, precision, tokenPrice, _locked) Multivest(multivestAddress) {
        etherHolderAddress = _etherHolderAddress;
        softCap = _softCap;
        hardCap = _hardCap;
        icoSince = _icoSince;
        icoTill = _icoSince + 2678400;// 31 days
    }

    function buy(address _address, uint256 value) internal returns (bool) {
        uint256 time = now;

        if (locked == true) {
            return false;
        }
        if (totalSupply() == hardCap) {
            return false;
        }
        if (icoSince > time) {
            return false;
        }
        if (icoTill < time) {
            return false;
        }

        uint256 amount = getTokensAmount(value);

        if (amount == 0) {
            return false;
        }

        if (totalSupply() + amount >= softCap) {
            icoTill += 604800;// additional 7 days if the softCap is reached before the end of 31 days;
        }

        if (amount != mint(_address, amount)) {
            return false;
        }

        return true;
    }

    function getTokensAmount(uint256 value) internal returns (uint256) {
        if (value == 0) {
            return 0;
        }

        uint256 amount = value * (uint256(10) ** decimals) / tokenPrice;

        if (totalSupply() < softCap) {
            uint256 bonusAmount = amount;
            if (totalSupply() + amount > softCap) {
                bonusAmount = softCap - totalSupply();
            }
            amount += bonusAmount * 2 / 10;
        }

        if (totalSupply() + amount > hardCap) {
            return 0;
        }

        return amount;
    }

    function transferEthers() onlyOwner {
        require(address(etherHolderAddress) != 0x0);

        etherHolderAddress.transfer(this.balance);
    }

}