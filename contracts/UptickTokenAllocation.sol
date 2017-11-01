pragma solidity 0.4.15;


import "./Ownable.sol";
import "./UptickICO.sol";
import "./SafeMath.sol";


contract UptickTokenAllocation is Ownable {

    using SafeMath for uint256;

    uint256 public constant MONTH_SECONDS = 2629744;

    bool public isTokensDistributed = false;

    UptickICO public uptickICO;

    Allocation[] public partners;

    TeamsAllocation[] public teams;

    struct Allocation {
        uint256 amount;
        address destAddress;
    }

    struct TeamsAllocation {
        uint256 period;
        uint256 cliff;
        uint256 cliffAmount;
        uint256 distributionTime;
        address destAddress;
    }

    function UptickTokenAllocation(
        address _uptickICO,

        uint8 _teamsPercentage,
        uint256 _teamsPeriod, //months
        uint256 _teamCliff, //months
        address[] _teamAddresses,

        uint8 _rewardsPercentage,
        address[] _rewardsAddresses,

        uint8 _partnersPercentage,
        address[] _partnersAddresses
    ) {
        require(address(_uptickICO) != 0x0);
        uptickICO = UptickICO(address(_uptickICO));

        require( (uptickICO.maxSupply().sub(uptickICO.hardCap()).mul(100).div(uptickICO.maxSupply())) == uint256(_rewardsPercentage).add(_teamsPercentage).add(_partnersPercentage) );

        require(setAllocation(_rewardsPercentage, _rewardsAddresses) == true);
        require(setAllocation(_partnersPercentage, _partnersAddresses) == true);
        require(setTeamAllocation(_teamsPercentage, _teamsPeriod, _teamCliff, _teamAddresses) == true);

    }

    function setTeamAllocation(
        uint8 _teamsPercentage,
        uint256 _teamsPeriod,
        uint256 _teamCliff,
        address[] _teamAddresses
    ) internal returns (bool) {

        if (_teamsPercentage < 1) {
            return false;
        }
        if (_teamsPercentage > 100) {
            return false;
        }
        if (_teamsPeriod < 1) {
            return false;
        }
        if (_teamCliff < 1 || _teamCliff > _teamsPeriod) {
            return false;
        }

        if (_teamAddresses.length < 1) {
            return false;
        }

        uint256 amount = uptickICO.maxSupply().mul(_teamsPercentage).div(100).div(_teamAddresses.length);

        for (uint8 i = 0; i < _teamAddresses.length; i++) {
            teams.push(TeamsAllocation(_teamsPeriod, _teamCliff, amount.mul(_teamCliff).div(_teamsPeriod), uptickICO.icoSince(), _teamAddresses[i]));
        }

        return true;
    }

    function setAllocation(uint8 _percentage, address[] _addresses) internal returns (bool) {
        if (_percentage < 1) {
            return false;
        }
        if (_percentage > 100) {
            return false;
        }
        if (_addresses.length < 1) {
            return false;
        }

        uint256 amount = uptickICO.maxSupply().mul(_percentage).div(100).div(_addresses.length);

        for (uint8 i = 0; i < _addresses.length; i++) {
            partners.push(Allocation(amount, _addresses[i]));
        }

        return true;
    }

    function allocateTokens() public {
        require(address(uptickICO) != 0x0);

        if (isTokensDistributed == false) {
            require(uint8(partners.length) > 0);
            for (uint8 i = 0; i < partners.length; i++) {
                Allocation storage allocation = partners[i];
                uint256 mintedAmount = uptickICO.mint(allocation.destAddress, allocation.amount);
                require(mintedAmount == allocation.amount);
            }
            isTokensDistributed = true;
        }

        for (uint8 j = 0; j < teams.length; j++) {
            TeamsAllocation storage team = teams[j];
            if (uptickICO.icoSince().add(team.cliff).mul(MONTH_SECONDS) < team.distributionTime) {
                continue;
            }
            uint256 mul = now.sub(team.distributionTime).div(team.cliff.mul(MONTH_SECONDS));
            if (mul < 1) {
                continue;
            }

            if (mul > team.period.div(team.cliff)) {
                mul = team.period.div(team.cliff);
            }
            mintedAmount = uptickICO.mint(team.destAddress, team.cliffAmount.mul(mul));
            require(mintedAmount == team.cliffAmount.mul(mul));
            team.distributionTime = now;
        }
    }

    function setUptickICO(address _uptickICO) public onlyOwner {
        uptickICO = UptickICO(_uptickICO);
    }


}