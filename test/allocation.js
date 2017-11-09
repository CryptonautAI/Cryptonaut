var Uptick = artifacts.require('./UptickICO.sol'),
    UptickAllocation = artifacts.require('./UptickTokenAllocation.sol'),
    TestUptickAllocation = artifacts.require('./test/TestUptickTokenAllocation.sol'),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber(1000000000000000000),
    Utils = require('./utils');

var SigAddress = web3.eth.accounts[1],
    etherHolderAddress = web3.eth.accounts[3],
    monthSeconds = 2629744;

contract('UptickTokenAllocation', function(accounts) {
    it('deploy & check "rewards" and "partners" allocation', function() {
        var UptickContract,
            UptickAllocationContract,
            ICOSince = parseInt(new Date().getTime() / 1000),
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000),//_tokenPrice
            softCap,//softCap
            hardCap,//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => UptickContract = _instance)
            .then(() => {
                return UptickAllocation.new(
                    UptickContract.address,
                    8,//teamsPercentage
                    12,//teamsPeriod
                    3,//teamCliff
                    [
                        accounts[10],
                        accounts[11],
                    ],//teamAddresses
                    5,//rewardsPercentage
                    [
                        accounts[21],
                        accounts[22],
                    ],//rewardsAddresses
                    7,//partnersPercentage
                    [
                        accounts[31],
                        accounts[32],
                    ],//partnersAddresses
                )
            })
            .then((_instance) => UptickAllocationContract = _instance)

            .then(() => { return UptickContract.addMinter(UptickAllocationContract.address); })

            .then(() => { return UptickAllocationContract.allocateTokens(); })
            .then(Utils.receiptShouldSucceed)
            //rewardsPercentage 130000000 * 5 / 100 = 6500000 | / 2 = 3250000
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[21], new BigNumber('3250000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[22], new BigNumber('3250000').mul(precision).valueOf()))
            //partnersPercentage 130000000 * 7 / 100 = 9100000 | / 2 = 4550000
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[31], new BigNumber('4550000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[32], new BigNumber('4550000').mul(precision).valueOf()))

            .then(() => { return UptickAllocationContract.allocateTokens(); })
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[21], new BigNumber('3250000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[22], new BigNumber('3250000').mul(precision).valueOf()))

            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[31], new BigNumber('4550000').mul(precision).valueOf()))
           .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[32], new BigNumber('4550000').mul(precision).valueOf()))
            // 5% + 7% + 80% = 92
            // 6500000 + 9100000 + 104000000 = 119600000 | 130000000 - 119600000 = 10400000 | 10400000 * 100 / 130000000 = 8%

            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber(0).mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber(0).mul(precision).valueOf()))
    });

    it('deploy & check vesting allocation', function() {
        var UptickContract,
            UptickAllocationContract,
            ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 3,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000),//_tokenPrice
            softCap,//softCap
            hardCap,//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => UptickContract = _instance)
            .then(() => {
                return UptickAllocation.new(
                    UptickContract.address,
                    8,//teamsPercentage
                    12,//teamsPeriod
                    3,//teamCliff
                    [
                        accounts[10],
                        accounts[11],
                    ],//teamAddresses
                    5,//rewardsPercentage
                    [
                        accounts[21],
                        accounts[22],
                    ],//rewardsAddresses
                    7,//partnersPercentage
                    [
                        accounts[31],
                        accounts[32],
                    ],//partnersAddresses
                )
            })
            .then((_instance) => UptickAllocationContract = _instance)

            .then(() => UptickContract.addMinter(UptickAllocationContract.address))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 3/12 = 1300000
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber('1300000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber('1300000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber('1300000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber('1300000').mul(precision).valueOf()))

            .then(() => UptickContract.setICOPeriod(ICOSince - monthSeconds * 3, ICOSince + monthSeconds * 3))

            .then(() => UptickContract.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince - monthSeconds * 3, 'ICOSince is not equal'))

            .then(() => UptickContract.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + monthSeconds * 3, 'ICOTill is not equal'))
    });

    it('deploy & check vesting allocation', function() {
        var UptickContract,
            UptickAllocationContract,
            ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 6,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000),//_tokenPrice
            softCap,//softCap
            hardCap,//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => UptickContract = _instance)
            .then(() => {
                return UptickAllocation.new(
                    UptickContract.address,
                    8,//teamsPercentage
                    12,//teamsPeriod
                    3,//teamCliff
                    [
                        accounts[10],
                        accounts[11],
                    ],//teamAddresses
                    5,//rewardsPercentage
                    [
                        accounts[21],
                        accounts[22],
                    ],//rewardsAddresses
                    7,//partnersPercentage
                    [
                        accounts[31],
                        accounts[32],
                    ],//partnersAddresses
                )
            })
            .then((_instance) => UptickAllocationContract = _instance)

            .then(() => UptickContract.addMinter(UptickAllocationContract.address))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 6/12 = 2600000
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber('2600000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber('2600000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber('2600000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber('2600000').mul(precision).valueOf()))
    });

    it('deploy & check vesting allocation', function() {
        var UptickContract,
            UptickAllocationContract,
            ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 15,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000),//_tokenPrice
            softCap,//softCap
            hardCap,//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => UptickContract = _instance)
            .then(() => {
                return UptickAllocation.new(
                    UptickContract.address,
                    8,//teamsPercentage
                    12,//teamsPeriod
                    3,//teamCliff
                    [
                        accounts[10],
                        accounts[11],
                    ],//teamAddresses
                    5,//rewardsPercentage
                    [
                        accounts[21],
                        accounts[22],
                    ],//rewardsAddresses
                    7,//partnersPercentage
                    [
                        accounts[31],
                        accounts[32],
                    ],//partnersAddresses
                )
            })
            .then((_instance) => UptickAllocationContract = _instance)

            .then(() => UptickContract.addMinter(UptickAllocationContract.address))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 15/12 = 5200000
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickContract, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))
    });

    it("test setTeamAllocation && setAllocation functions", async function () {
        let ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 15,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        let UptickContract = await Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000),//_tokenPrice
            softCap,//softCap
            hardCap,//hardCap
            ICOSince,//_icoSince
            false
        )

        let allocation = await TestUptickAllocation.new(
            UptickContract.address,
            8,//teamsPercentage
            12,//teamsPeriod
            3,//teamCliff
            [
                accounts[10],
                accounts[11],
            ],//teamAddresses
            5,//rewardsPercentage
            [
                accounts[21],
                accounts[22],
            ],//rewardsAddresses
            7,//partnersPercentage
            [
                accounts[31],
                accounts[32],
            ],//partnersAddresses
        )

        let check = await allocation.checkSetTeamAllocation.call(8, 12, 3, [accounts[10], accounts[11]])
        assert.equal(check.valueOf(), true, 'check value is not equal')

        check = await allocation.checkSetTeamAllocation.call(0, 12, 3, [accounts[10], accounts[11]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetTeamAllocation.call(101, 12, 3, [accounts[10], accounts[11]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetTeamAllocation.call(8, 0, 3, [accounts[10], accounts[11]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetTeamAllocation.call(8, 12, 0, [accounts[10], accounts[11]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetTeamAllocation.call(8, 12, 15, [accounts[10], accounts[11]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetTeamAllocation.call(8, 12, 3, [])
        assert.equal(check.valueOf(), false, 'check value is not equal')


        check = await allocation.checkSetAllocation.call(5, [accounts[21], accounts[22]])
        assert.equal(check.valueOf(), true, 'check value is not equal')

        check = await allocation.checkSetAllocation.call(0, [accounts[21], accounts[22]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetAllocation.call(101, [accounts[21], accounts[22]])
        assert.equal(check.valueOf(), false, 'check value is not equal')

        check = await allocation.checkSetAllocation.call(5, [])
        assert.equal(check.valueOf(), false, 'check value is not equal')

    });

});