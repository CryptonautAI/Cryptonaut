var Uptick = artifacts.require('./Uptick.sol');
var Utils = require('./utils');

var BigNumber = require('bignumber.js');
var precision = new BigNumber(1000000000000000000);

contract('Uptick', function(accounts) {
    it('deploy & check constructor data', function() {
        var instance, ICOSince = 1512345600;

        return Uptick.new(
            'TIC',
            'TIC',
            18,
            new BigNumber(349600000).mul(precision),//initialSupply
            new BigNumber(500000000000000),//_tokenPrice
            new BigNumber(179600000).mul(precision),//maxCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => instance.name.call())
            .then((result) => assert.equal(result.valueOf(), 'TIC', 'name is not equal'))

            .then(() => instance.symbol.call())
            .then((result) => assert.equal(result.valueOf(), 'TIC', 'symbol is not equal'))

            .then(() => instance.decimals.call())
            .then((result) => assert.equal(result.valueOf(), 18, 'precision is not equal'))

            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(349600000).mul(precision)))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.tokenPrice.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(500000000000000), 'token price is not equal'))

            .then(() => instance.maxCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(179600000).mul(precision), 'maxCap is not equal'))

            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, 'locked is not equal'))
    });

    it('create contract, buy tokens, add to whitelist, get balance, check bonus', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            'TIC',
            'TIC',
            18,
            new BigNumber(349600000).mul(precision),//initialSupply
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(179600000).mul(precision),//maxCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(349600000).mul(precision)))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.sendTransaction({value: '1000000000000000000'}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.addToWhiteList(accounts[0]))

            .then(() => instance.sendTransaction({value: '1000000000000000000'}))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.soldTokens.call())
            .then((result) => assert.equal(result.valueOf(), '2400', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(2400).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(349600000).mul(precision).valueOf() - 2400))

    });

    it('create contract, buy tokens, check price', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            'TIC',
            'TIC',
            18,
            new BigNumber(349600000).mul(precision),//initialSupply
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(3000),//maxCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(349600000).mul(precision)))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.maxCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(3000), 'maxCap is not equal'))

            .then(() => instance.addToWhiteList(accounts[0]))

            .then(() => instance.sendTransaction({value: '1000000000000000000'}))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.soldTokens.call())
            .then((result) => assert.equal(result.valueOf(), '2400', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(2400).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(349600000).mul(precision).valueOf() - 2400))

            .then(() => instance.sendTransaction({value: '1000000000000000000'}))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.soldTokens.call())
            // 2400 + 2000 + bonus; bonus = 3000 - 2400 | 600 = 120 | total = 4520
            .then((result) => assert.equal(result.valueOf(), '4520', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(4520).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(349600000).mul(precision).valueOf() - 4520))

    });
});