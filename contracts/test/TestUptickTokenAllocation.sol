pragma solidity 0.4.15;

import "../UptickTokenAllocation.sol";


contract TestUptickTokenAllocation is UptickTokenAllocation {

    function TestUptickTokenAllocation(
        address _uptickICO,
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

}