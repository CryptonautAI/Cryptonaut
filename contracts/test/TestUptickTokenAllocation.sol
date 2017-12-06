pragma solidity 0.4.15;

import "../UptickTokenAllocation.sol";


contract TestUptickTokenAllocation is UptickTokenAllocation {

    function TestUptickTokenAllocation(
        address _uptickICO,
        address _uptickToken,
        uint8 _teamsPercentage,
        uint256 _teamsPeriod, //months
        uint256 _teamCliff, //months
        address[] _teamAddresses,
        uint8 _rewardsPercentage,
        address[] _rewardsAddresses,
        uint8 _partnersPercentage,
        address[] _partnersAddresses
    ) UptickTokenAllocation(
        _uptickICO,
        _uptickToken,
        _teamsPercentage,
        _teamsPeriod, //months
        _teamCliff, //months
        _teamAddresses,
        _rewardsPercentage,
        _rewardsAddresses,
        _partnersPercentage,
        _partnersAddresses
    ) {

    }

    function checkSetTeamAllocation(
        uint8 _teamsPercentage,
        uint256 _teamsPeriod,
        uint256 _teamCliff,
        address[] _teamAddresses
    ) public returns (bool) {
        return super.setTeamAllocation(_teamsPercentage, _teamsPeriod, _teamCliff, _teamAddresses);
    }

    function checkSetAllocation(uint8 _percentage, address[] _addresses) public returns (bool) {
        return super.setAllocation(_percentage, _addresses);
    }

    function testAllocateTokens(uint256 _currentTime) public {
        require(address(uptickICO) != address(0) && address(uptickToken) != address(0));

        if (isTokensDistributed == false) {
            require(uint8(partners.length) > 0);
            for (uint8 i = 0; i < partners.length; i++) {
                Allocation storage allocation = partners[i];
                uint256 mintedAmount = uptickToken.mint(allocation.destAddress, allocation.amount);
                require(mintedAmount == allocation.amount);
            }
            isTokensDistributed = true;
        }

        for (uint8 j = 0; j < teams.length; j++) {
            TeamsAllocation storage team = teams[j];
            if (uptickICO.icoSince().add(team.period.mul(MONTH_SECONDS)) < team.distributionTime) {
                continue;
            }
            uint256 mul = _currentTime.sub(team.distributionTime).div(team.cliff.mul(MONTH_SECONDS));
            if (mul < 1) {
                continue;
            }
            if (mul > team.period.div(team.cliff)) {
                mul = team.period.div(team.cliff);
            }
            uint256 minted = uptickToken.mint(team.destAddress, team.cliffAmount.mul(mul));
            require(minted == team.cliffAmount.mul(mul));
            team.distributionTime = _currentTime;
        }
    }


}