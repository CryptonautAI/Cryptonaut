pragma solidity 0.4.15;

import "./MintingERC20.sol";


contract Uptick is MintingERC20 {

    uint256 public tokenPrice; //0.0005 ether;

    function Uptick(
        uint256 _maxSupply,
        string _tokenName,
        string _tokenSymbol,
        uint8 _precision,
        uint256 _tokenPrice,
        bool _locked
    ) MintingERC20(0, _maxSupply, _tokenName, _precision, _tokenSymbol, false, _locked) {
        standard = "Uptick 0.1";
        tokenPrice = _tokenPrice;
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

}