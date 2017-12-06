var Uptick = artifacts.require('./UptickICO.sol'),
    Token = artifacts.require('./Uptick.sol'),
    UptickAllocation = artifacts.require('./UptickTokenAllocation.sol'),
    TestUptickAllocation = artifacts.require('./test/TestUptickTokenAllocation.sol'),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber(1000000000000000000),
    Utils = require('./utils');

var SigAddress = web3.eth.accounts[1],
    etherHolderAddress = web3.eth.accounts[3],
    monthSeconds = 2629744,
    UptickContract,
    UptickAllocationContract,
    UptickToken;

function deploy(ICOSince, softCap, hardCap) {

    return Token.new(
        new BigNumber(130000000).mul(precision),//maxSupply
        'TIC',
        'TIC',
        18,
        false
    )
        .then((_instance) => UptickToken = _instance)
        .then(() => {
            return Uptick.new(
                etherHolderAddress,
                SigAddress,
                softCap,//softCap
                hardCap,//hardCap
                ICOSince,//_icoSince
                new BigNumber(500000000000000)//_tokenPrice
            )
        })
        .then((_instance) => UptickContract = _instance)
        .then(() => UptickContract.setUptick(UptickToken.address))
        .then(() => UptickContract.setAllowedMultivest(UptickContract.address))
        .then(() => UptickToken.setUptickICO(UptickContract.address))
        .then(() => UptickToken.addMinter(UptickContract.address))
        .then(() => {
            return TestUptickAllocation.new(
                UptickContract.address,
                UptickToken.address,
                8,//teamsPercentage
                12,//teamsPeriod
                3,//teamCliff
                [
                    web3.eth.accounts[10],
                    web3.eth.accounts[11],
                ],//teamAddresses
                5,//rewardsPercentage
                [
                    web3.eth.accounts[21],
                    web3.eth.accounts[22],
                ],//rewardsAddresses
                7,//partnersPercentage
                [
                    web3.eth.accounts[31],
                    web3.eth.accounts[32],
                ],//partnersAddresses
            )
        })
        .then((result) => UptickAllocationContract = result)
        .then(() => UptickToken.addMinter(UptickAllocationContract.address))
}

contract('UptickTokenAllocation', function (accounts) {

    it('deploy & check "rewards" and "partners" allocation', async function () {
        var ICOSince = parseInt(new Date().getTime() / 1000),
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        await deploy(ICOSince, softCap, hardCap)
            .then(() => {
                return UptickAllocationContract.allocateTokens();
            })
            .then(Utils.receiptShouldSucceed)
            //rewardsPercentage 130000000 * 5 / 100 = 6500000 | / 2 = 3250000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[21], new BigNumber('3250000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[22], new BigNumber('3250000').mul(precision).valueOf()))
            //partnersPercentage 130000000 * 7 / 100 = 9100000 | / 2 = 4550000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[31], new BigNumber('4550000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[32], new BigNumber('4550000').mul(precision).valueOf()))

            .then(() => {
                return UptickAllocationContract.allocateTokens();
            })
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[21], new BigNumber('3250000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[22], new BigNumber('3250000').mul(precision).valueOf()))

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[31], new BigNumber('4550000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[32], new BigNumber('4550000').mul(precision).valueOf()))
            // 5% + 7% + 80% = 92
            // 6500000 + 9100000 + 104000000 = 119600000 | 130000000 - 119600000 = 10400000 | 10400000 * 100 / 130000000 = 8%

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber(0).mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber(0).mul(precision).valueOf()))
    });

    it('deploy & check vesting allocation 1', async function () {
        var ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 3,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);

        await deploy(ICOSince, softCap, hardCap)
            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 3/12 = 1300000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('1300000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('1300000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('1300000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('1300000').mul(precision).valueOf()))

            .then(() => UptickContract.setICOPeriod(ICOSince - monthSeconds * 3, ICOSince + monthSeconds * 3))

            .then(() => UptickContract.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince - monthSeconds * 3, 'ICOSince is not equal'))

            .then(() => UptickContract.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + monthSeconds * 3, 'ICOTill is not equal'))
    });

    it('deploy & check vesting allocation 2', async function () {
        var ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 6,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);
        await deploy(ICOSince, softCap, hardCap)
            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 6/12 = 2600000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('2600000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('2600000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('2600000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('2600000').mul(precision).valueOf()))
    });

    it('deploy & check vesting allocation 3', async function () {
        var ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 18,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);
        await deploy(ICOSince, softCap, hardCap)
            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 15/12 = 5200000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.allocateTokens())
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))
    });

    it('deploy & check vesting allocation 4', async function () {
        var ICOSince = parseInt(new Date().getTime() / 1000),
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);
        await deploy(ICOSince, softCap, hardCap)
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('0').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('0').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000)))
            .then(Utils.receiptShouldSucceed)

            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('0').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('0').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 4))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 3/12 = 1300000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('1300000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('1300000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 4))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 3/12 = 1300000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('1300000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('1300000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 7))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 6/12 = 2600000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('2600000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('2600000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 10))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 9/12 = 3900000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('3900000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('3900000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 13))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 12/12 = 5200000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 16))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 15/12 = 5200000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))
    });

    it('deploy & check vesting allocation 5', async function () {
        var ICOSince = parseInt(new Date().getTime() / 1000),
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);
        await deploy(ICOSince, softCap, hardCap)
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('0').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('0').mul(precision).valueOf()))

            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 9))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 9/12 = 3900000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('3900000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('3900000').mul(precision).valueOf()))
            //
            .then(() => UptickAllocationContract.testAllocateTokens(parseInt(new Date().getTime() / 1000) + monthSeconds * 18))
            .then(Utils.receiptShouldSucceed)

            // 10400000 / 2 = 5200000 | 5200000 * 12/12 = 5200000
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[10], new BigNumber('5200000').mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(UptickToken, accounts[11], new BigNumber('5200000').mul(precision).valueOf()))

    });

    it("test setTeamAllocation && setAllocation functions", async function () {
        let ICOSince = parseInt(new Date().getTime() / 1000) - monthSeconds * 15,
            softCap = new BigNumber(10000).mul(2400).mul(precision),
            hardCap = new BigNumber((40000 * 2000) + (10000 * 2400)).mul(precision);
            await deploy(ICOSince, softCap, hardCap)
            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(8, 12, 3, [accounts[10], accounts[11]])
            })
            .then((result) => assert.equal(result.valueOf(), true, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(0, 12, 3, [accounts[10], accounts[11]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(101, 12, 3, [accounts[10], accounts[11]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(8, 0, 3, [accounts[10], accounts[11]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(8, 12, 0, [accounts[10], accounts[11]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(8, 12, 15, [accounts[10], accounts[11]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetTeamAllocation.call(8, 12, 3, [])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))


            .then(() => {
                return UptickAllocationContract.checkSetAllocation.call(5, [accounts[21], accounts[22]])
            })
            .then((result) => assert.equal(result.valueOf(), true, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetAllocation.call(0, [accounts[21], accounts[22]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetAllocation.call(101, [accounts[21], accounts[22]])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

            .then(() => {
                return UptickAllocationContract.checkSetAllocation.call(5, [])
            })
            .then((result) => assert.equal(result.valueOf(), false, 'check value is not equal'))

    });

});