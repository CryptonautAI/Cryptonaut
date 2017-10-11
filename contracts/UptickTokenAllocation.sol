pragma solidity ^0.4.13;


import './Ownable.sol';
import './UptickICO.sol';


contract UptickTokenAllocation is Ownable {

    uint256 public constant MONTH_SECONDS = 2629744;

    UptickICO public uptickICO;

    bool public isTokensDistributed = false;

    Allocation[] partners;

    TeamsAllocation[] teams;

    struct Allocation {
        uint256 amount;
        address _address;
    }

    struct TeamsAllocation {
        uint256 period;
        uint256 cliff;
        uint256 cliffAmount;
        uint256 distributionTime;
        address _address;
    }

    function UptickTokenAllocation(
        address _uptickICO,

        uint8 teamsPercentage,
        uint256 teamsPeriod, //months
        uint256 teamCliff, //months
        address[] teamAddresses,

        uint8 rewardsPercentage,
        address[] rewardsAddresses,

        uint8 partnersPercentage,
        address[] partnersAddresses
    ){
        require(address(_uptickICO) != 0x0);
        uptickICO = UptickICO(address(_uptickICO));

        require(uint8((uptickICO.maxSupply() - uptickICO.hardCap()) * 100 / uptickICO.maxSupply()) == uint8(teamsPercentage + rewardsPercentage + partnersPercentage));

        require(setAllocation(rewardsPercentage, rewardsAddresses) == true);
        require(setAllocation(partnersPercentage, partnersAddresses) == true);
        require(setTeamAllocation(teamsPercentage, teamsPeriod, teamCliff, teamAddresses) == true);

    }

    function setUptickICO(address _uptickICO) onlyOwner {
        uptickICO = UptickICO(_uptickICO);
    }

    function setTeamAllocation(
        uint8 teamsPercentage,
        uint256 teamsPeriod,
        uint256 teamCliff,
        address[] teamAddresses
    ) internal returns (bool) {

        if (teamsPercentage < 1) {
            return false;
        }
        if (teamsPercentage > 100) {
            return false;
        }
        if (teamsPeriod < 1) {
            return false;
        }
        if (teamCliff < 1 || teamCliff > teamsPeriod) {
            return false;
        }

        if (teamAddresses.length < 1) {
            return false;
        }

        uint256 amount = (uptickICO.maxSupply() * teamsPercentage / 100) / teamAddresses.length;

        for (uint8 i = 0; i < teamAddresses.length; i++) {
            teams.push(TeamsAllocation(teamsPeriod, teamCliff, amount * teamCliff / teamsPeriod, uptickICO.icoSince(), teamAddresses[i]));
        }

        return true;
    }

    function setAllocation(uint8 percentage, address[] addresses) internal returns (bool) {
        if (percentage < 1) {
            return false;
        }
        if (percentage > 100) {
            return false;
        }
        if (addresses.length < 1) {
            return false;
        }

        uint256 amount = (uptickICO.maxSupply() * percentage / 100) / addresses.length;

        for (uint8 i = 0; i < addresses.length; i++) {
            partners.push(Allocation(amount, addresses[i]));
        }

        return true;
    }

    function allocateTokens(){
        require(address(uptickICO) != 0x0);

        if (isTokensDistributed == false) {
            require(uint8(partners.length) > 0);
            for (uint8 i = 0; i < partners.length; i++) {
                Allocation storage allocation = partners[i];
                uint256 mintedAmount = uptickICO.mint(allocation._address, allocation.amount);
                require(mintedAmount == allocation.amount);
            }
            isTokensDistributed = true;
        }

        for (uint8 j = 0; j < teams.length; j++) {
            TeamsAllocation storage team = teams[j];
            if ((uptickICO.icoSince() + team.cliff * MONTH_SECONDS) < team.distributionTime) {
                continue;
            }
            uint256 mul = (now - team.distributionTime) / (team.cliff * MONTH_SECONDS);
            if (mul < 1) {
                continue;
            }

            if (mul > (team.period / team.cliff)) {
                mul = team.period / team.cliff;
            }
            mintedAmount = uptickICO.mint(team._address, team.cliffAmount * mul);
            require(mintedAmount == team.cliffAmount * mul);
            team.distributionTime = now;
        }
    }

}