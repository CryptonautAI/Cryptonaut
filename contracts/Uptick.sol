pragma solidity 0.4.15;

import "./MintingERC20.sol";
import "./UptickICO.sol";


contract Uptick is MintingERC20 {

    UptickICO public uptickICO;

    modifier onlyMultivests(address _addresss) {
        require(address(uptickICO) != address(0));
        require(uptickICO.allowedMultivests(_addresss) == true);
        _;
    }

    function Uptick(
        uint256 _maxSupply,
        string _tokenName,
        string _tokenSymbol,
        uint8 _precision,
        bool _locked
    ) MintingERC20(0, _maxSupply, _tokenName, _precision, _tokenSymbol, false, _locked) {
        standard = "Uptick 0.1";
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

    function setUptickICO(address _uptickICO) public onlyOwner {
        require(_uptickICO != address(0));
        uptickICO = UptickICO(_uptickICO);
    }

    function burn(address _address) public onlyMultivests(msg.sender) {
        require(isAddressLocked(_address) == true);

        totalSupply = totalSupply.sub(balanceOf[_address]);
        balanceOf[_address] = 0;
        setLockedAddressInternal(_address, false);
    }

    function setLockedAddress(address _address, bool _lock) public onlyMultivests(msg.sender) {
        require(_address != address(0));
        setLockedAddressInternal(_address, _lock);
    }

}