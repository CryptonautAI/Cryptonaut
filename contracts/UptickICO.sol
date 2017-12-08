pragma solidity 0.4.15;


import "./Uptick.sol";
import "./Multivest.sol";
import "./SafeMath.sol";


contract UptickICO is Multivest {

    using SafeMath for uint256;

    Uptick public uptickToken;

    uint256 public constant DAY = 86400;

    uint256 public tokenPrice; //0.0005 ether;

    uint256 public softCap;

    uint256 public hardCap;

    uint256 public icoSince;

    uint256 public icoTill;

    uint256 public soldTokens;

    uint256 public collectedEthers;

    address public etherHolderAddress;

    function UptickICO(
        address _etherHolderAddress,
        address _multivestAddress,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _icoSince,
        uint256 _tokenPrice
    )
        Multivest(_multivestAddress)
    {
        require(_etherHolderAddress != address(0));
        etherHolderAddress = _etherHolderAddress;
        tokenPrice = _tokenPrice;
        softCap = _softCap;
        hardCap = _hardCap;
        icoSince = _icoSince;
        icoTill = _icoSince + DAY.mul(31);// 31 days
    }

    function setUptick(address _uptick) public onlyOwner {
        require(_uptick != address(0));
        uptickToken = Uptick(_uptick);
    }

    function setICOPeriod(uint256 _since, uint256 _till) public onlyOwner {
        require(_since < _till);
        icoSince = _since;
        icoTill = _till;
    }

    function transferEthers() public onlyOwner {
        etherHolderAddress.transfer(this.balance);
    }

    function getTokensAmount(uint256 _value) public constant returns (uint256) {
        if (_value == 0) {
            return 0;
        }

        uint256 amount = _value.mul(uint256(10) ** uptickToken.decimals()).div(tokenPrice);

        if (soldTokens < softCap) {
            uint256 bonusAmount = amount;
            if (soldTokens.add(amount) > softCap) {
                bonusAmount = softCap.sub(soldTokens);
            }
            amount = amount.add(bonusAmount.mul(2).div(10));
        }

        if (soldTokens.add(amount) > hardCap) {
            return 0;
        }

        return amount;
    }

    function increaseCollectedEthers(uint256 _value) internal returns (bool) {
        require(_value > 0);
        collectedEthers = collectedEthers.add(_value);
    }

    function buy(address _address, uint256 _value, bool _lockedAddress) internal returns (bool) {
        require(address(uptickToken) != address(0));
        uint256 time = now;

        if (uptickToken.locked() == true || soldTokens == hardCap) {
            return false;
        }
        if (icoSince > time || icoTill < time) {
            return false;
        }
        if (_lockedAddress == true) {
            uptickToken.setLockedAddress(msg.sender, true);
        }
        uint256 amount = getTokensAmount(_value);
        if (amount == 0) {
            return false;
        }
        if ((soldTokens.add(amount) >= softCap) && (icoTill.sub(icoSince) <= DAY.mul(31))) {
            icoTill = icoTill.add(DAY.mul(7));
            // additional 7 days if the softCap is reached before the end of 31 days;
        }

        require(amount == uptickToken.mint(_address, amount));
        soldTokens = soldTokens.add(amount);

        return true;
    }

}