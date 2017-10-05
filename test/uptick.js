var Uptick = artifacts.require('./UptickICO.sol'),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber(1000000000000000000),
    Utils = require('./utils');

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

var SigAddress = web3.eth.accounts[1],
    WrongSigAddress = web3.eth.accounts[2],
    etherHolderAddress = web3.eth.accounts[3],
    h = abi.soliditySHA3(["address"], [new BN(web3.eth.accounts[0].substr(2), 16)]),
    sig = web3.eth.sign(SigAddress, h.toString('hex')).slice(2),
    r = `0x${sig.slice(0, 64)}`,
    s = `0x${sig.slice(64, 128)}`,
    v = web3.toDecimal(sig.slice(128, 130)) + 27;

function makeTransaction(instance, value) {
    "use strict";
    var data = abi.simpleEncode("multivestBuy(bytes32,uint8,bytes32,bytes32)", h, v, r, s);

    return instance.sendTransaction({value: value, data: data.toString('hex')});
}

contract('UptickICO', function(accounts) {
    it('deploy & check constructor data', function() {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000),//_tokenPrice
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => instance.allowedMultivests.call(WrongSigAddress))
            .then((result) => assert.equal(result.valueOf(), false, "should be fail"))

            .then(() => instance.allowedMultivests.call(SigAddress))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            .then(() => instance.name.call())
            .then((result) => assert.equal(result.valueOf(), 'TIC', 'name is not equal'))

            .then(() => instance.symbol.call())
            .then((result) => assert.equal(result.valueOf(), 'TIC', 'symbol is not equal'))

            .then(() => instance.decimals.call())
            .then((result) => assert.equal(result.valueOf(), 18, 'precision is not equal'))

            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber(0).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.tokenPrice.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(500000000000000), 'token price is not equal'))

            .then(() => instance.softCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(24000000).mul(precision), 'softCap is not equal'))

            .then(() => instance.hardCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(100000000).mul(precision), 'hardCap is not equal'))

            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince, 'ICOSince is not equal'))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400, 'ICOTill is not equal'))

            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, 'locked is not equal'))
    });

    it('create contract, buy tokens with correct sign address, get balance, check price', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)

            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '2400', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(2400).valueOf()))
    });

    it('create contract, buy tokens with incorrect sign address, get balance', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            etherHolderAddress,
            WrongSigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(0).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))
    });

    it('create contract, buy tokens with correct sign address, check price after SoftCap, check sale period', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(3000),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.softCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(3000), 'softCap is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '2400', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(2400).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400, 'ICOTill is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.totalSupply.call())
            // 2400 + 2000 + bonus; bonus = 3000 - 2400 | 600 = 120 | total = 4520
            .then((result) => assert.equal(result.valueOf(), '4520', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(4520).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400 + 604800, 'ICOTill is not equal'))
    });

    it('create contract, buy tokens with correct sign address before sale period', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000) + 3600;

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '0', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))
    });

    it('create contract, buy tokens with correct sign address after sale period', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000) - 3600 * 24 * 32;

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '0', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))
    });

    it('create contract, buy tokens with correct sign address, try to contribute after hardCap', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(3000),//softCap
            new BigNumber(4520),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.softCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(3000), 'softCap is not equal'))

            .then(() => instance.hardCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(4520), 'hardCap is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '2400', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(2400).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400, 'ICOTill is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => instance.totalSupply.call())
            // 2400 + 2000 + bonus; bonus = 3000 - 2400 | 600 = 120 | total = 4520
            .then((result) => assert.equal(result.valueOf(), '4520', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(4520).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400 + 604800, 'ICOTill is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '4520', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(4520).valueOf()))
    });

    it('create contract, buy tokens with correct sign address, check ethers transfer', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Uptick.new(
            etherHolderAddress,
            SigAddress,
            'TIC',
            'TIC',
            new BigNumber(130000000).mul(precision),//totalSupply
            18,
            new BigNumber(500000000000000).mul(precision),//_tokenPrice
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            ICOSince,//_icoSince
            false
        )
            .then((_instance) => instance = _instance)

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '5000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)

            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '12000', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber(12000).valueOf()))

            .then(() => { contractEthBalance = Utils.getEtherBalance(instance.address); })
            .then(() => { etherHolderBalance = Utils.getEtherBalance(etherHolderAddress); })

            .then(() => instance.transferEthers())

            .then((result)=> { Utils.receiptShouldSucceed(result); return Utils.getTxCost(result); })

            .then((result) => Utils.checkEtherBalance(etherHolderAddress, parseFloat(contractEthBalance) + parseFloat(etherHolderBalance)))

            .then(() => { Utils.checkEtherBalance(instance.address, 0); })
    });

});