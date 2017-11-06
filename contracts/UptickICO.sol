pragma solidity 0.4.15;


import "./Uptick.sol";
import "./Multivest.sol";
import "./SafeMath.sol";


contract UptickICO is Uptick, Multivest {

    using SafeMath for uint256;

    uint256 public constant DAY = 86400;

    uint256 public softCap;

    uint256 public hardCap;

    uint256 public icoSince;

    uint256 public icoTill;

    address public etherHolderAddress;

    function UptickICO(
        address _etherHolderAddress,
        address _multivestAddress,
        string _tokenName,
        string _tokenSymbol,
        uint256 _totalSupply,
        uint8 _precision,
        uint256 _tokenPrice,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _icoSince,
        bool _locked
    )
        Uptick(_totalSupply, _tokenName, _tokenSymbol, _precision, _tokenPrice, _locked)
        Multivest(_multivestAddress)
    {
        etherHolderAddress = _etherHolderAddress;
        softCap = _softCap;
        hardCap = _hardCap;
        icoSince = _icoSince;
        icoTill = _icoSince + DAY.mul(31);// 31 days
    }

    function setICOPeriod(uint256 _since, uint256 _till) public onlyOwner {
        require(_since < _till);
        icoSince = _since;
        icoTill = _till;
    }

    function transferEthers() public onlyOwner {
        require(address(etherHolderAddress) != 0x0);

        etherHolderAddress.transfer(this.balance);
    }

    function setLockedAddress(address _address, bool _lock) public onlyMultivests(msg.sender) {
        setLockedAddressInternal(_address, _lock);
    }

    function buy(address _address, uint256 _value, bool _lockedAddress) internal returns (bool) {
        if (_lockedAddress == true) {
            setLockedAddressInternal(msg.sender, true);
        }

        uint256 time = now;
        if (locked == true || totalSupply == hardCap) {
            return false;
        }
        if (icoSince > time || icoTill < time) {
            return false;
        }
        uint256 amount = getTokensAmount(_value);
        if (amount == 0) {
            return false;
        }
        if ((totalSupply.add(amount) >= softCap) && (icoTill.sub(icoSince) <= DAY.mul(31))) {
            icoTill = icoTill.add(DAY.mul(7));// additional 7 days if the softCap is reached before the end of 31 days;
        }

        require(amount == mint(_address, amount));

        return true;
    }

    function getTokensAmount(uint256 _value) internal returns (uint256) {
        if (_value == 0) {
            return 0;
        }

        uint256 amount = _value.mul(uint256(10) ** decimals).div(tokenPrice);

        if (totalSupply < softCap) {
            uint256 bonusAmount = amount;
            if (totalSupply.add(amount) > softCap) {
                bonusAmount = softCap.sub(totalSupply);
            }
            amount = amount.add(bonusAmount.mul(2).div(10));
        }

        if (totalSupply.add(amount) > hardCap) {
            return 0;
        }

        return amount;
    }

}