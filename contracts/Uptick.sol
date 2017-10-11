pragma solidity ^0.4.13;


import './MintingERC20.sol';

contract Uptick is MintingERC20 {

    uint256 public maxSupply;

    uint256 public tokenPrice; //0.0005 ether;

    function Uptick(
        uint256 _maxSupply,
        string tokenName,
        string tokenSymbol,
        uint8 precision,
        uint256 _tokenPrice,
        bool locked
    ) MintingERC20(0, _maxSupply, tokenName, precision, tokenSymbol, false, locked) {
        standard = 'Uptick 0.1';
        maxSupply = _maxSupply;
        tokenPrice = _tokenPrice;
    }

    function setLocked(bool _locked) onlyOwner {
        locked = _locked;
    }

    function maxSupply() returns(uint256){
        return maxSupply;
    }

}