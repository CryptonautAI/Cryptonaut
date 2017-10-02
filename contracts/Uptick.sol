pragma solidity ^0.4.13;


import './ERC20.sol';


contract Uptick is ERC20 {

    uint256 public tokenPrice; //0.0005 ether;

    uint256 public soldTokens;

    uint256 public maxCap;

    uint256 public icoSince;

    uint256 public icoTill;

    mapping (address => bool) public whiteList;

    function Uptick(
        string tokenName,
        string tokenSymbol,
        uint8 precision,
        uint256 initialSupply,
        uint256 _tokenPrice,
        uint256 _maxCap,
        uint256 _icoSince,
        bool _locked
    ) ERC20(initialSupply, tokenName, precision, tokenSymbol, false, _locked) {
        standard = 'Uptick 0.1';
        tokenPrice = _tokenPrice;
        maxCap = _maxCap;
        icoSince = _icoSince;
        icoTill = _icoSince + 2678400; // 31 days
        soldTokens = 0;
    }

    function addToWhiteList(address _address) onlyOwner {
        whiteList[_address] = true;
    }

    function buy(address _address, uint256 time, uint256 value) internal returns (bool) {
        if (locked == true) {
            return false;
        }
        if (icoSince > time) {
            return false;
        }
        if (icoTill < time) {
            return false;
        }
        if (whiteList[_address] != true) {
            return false;
        }

        uint256 amount = getTokensAmount(value);

        if (amount == 0) {
            return false;
        }

        bool status = transferInternal(this, _address, amount);

        if (status == true) {
            soldTokens += amount;
        }

        return status;
    }

    function getTokensAmount(uint256 value) internal returns (uint256) {
        if (value == 0) {
            return 0;
        }

        uint256 amount = value * (uint256(10) ** decimals) / tokenPrice;

        if (soldTokens < maxCap) {
            uint256 bonusAmount = amount;
            if (soldTokens + amount > maxCap) {
                bonusAmount = maxCap - soldTokens;
            }
            amount += bonusAmount * 2 / 10;
        }

        if (soldTokens + amount > initialSupply) {
            return 0;
        }

        return amount;
    }

    function setLocked(bool _locked) onlyOwner {
        locked = _locked;
    }

    function() payable {
        bool status = buy(msg.sender, now, msg.value);

        require(status == true);
    }
}