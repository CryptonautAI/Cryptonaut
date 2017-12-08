var Uptick = artifacts.require('./UptickICO.sol'),
    Token = artifacts.require('./Uptick.sol'),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber(1000000000000000000),
    Utils = require('./utils');

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');
// console.log(web3.eth.accounts[0], web3.eth.accounts[0].substr(2), new BN(web3.eth.accounts[0].substr(2), 16));

var SigAddress = web3.eth.accounts[1],
    WrongSigAddress = web3.eth.accounts[2],
    etherHolderAddress = web3.eth.accounts[3],
    hashLock = true;

// function generateData(signAddress, buyerAddress) {
//     var h = abi.soliditySHA3(['address', 'bool'], [new BN(buyerAddress.substr(2), 16), hashLock]),
//         sig = web3.eth.sign(signAddress, h.toString('hex')).slice(2),
//         r = `0x${sig.slice(0, 64)}`,
//         s = `0x${sig.slice(64, 128)}`,
//         v = web3.toDecimal(sig.slice(128, 130)) + 27;
//
//     var data = abi.simpleEncode("multivestBuy(bytes32,uint8,bytes32,bytes32,bool)", h, v, r, s, hashLock);
//     console.log(SigAddress);
//     console.log(data.toString('hex'));
// }

// generateData(SigAddress, "0x4dD93664e39FbB2A229E6A88eb1Da53f4ccc88Ac")

function makeTransaction(instance, value) {
    'use strict';
    var h = abi.soliditySHA3(['address', 'bool'], [new BN(web3.eth.accounts[0].substr(2), 16), hashLock]),
        sig = web3.eth.sign(SigAddress, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('multivestBuy(bytes32,uint8,bytes32,bytes32,bool)', h, v, r, s, hashLock);

    return instance.sendTransaction({value: value, data: data.toString('hex')});
}

contract('UptickICO', function (accounts) {

    it('deploy & check constructor data', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000);

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(10000).mul(2400).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)

            .then(() => instance.allowedMultivests.call(WrongSigAddress))
            .then((result) => assert.equal(result.valueOf(), false, "should be fail"))

            .then(() => instance.allowedMultivests.call(SigAddress))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            .then(() => tokenContract.name.call())
            .then((result) => assert.equal(result.valueOf(), 'TIC', 'name is not equal'))

            .then(() => tokenContract.symbol.call())
            .then((result) => assert.equal(result.valueOf(), 'TIC', 'symbol is not equal'))

            .then(() => tokenContract.decimals.call())
            .then((result) => assert.equal(result.valueOf(), 18, 'precision is not equal'))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, tokenContract.address, new BigNumber(0).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

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

            .then(() => tokenContract.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, 'locked is not equal'))
    });

    it('create contract, buy tokens with correct sign address, get balance, check price', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000);

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(10000).mul(2400).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)

            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(2400).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(2400).mul(precision).valueOf()))
    });

    it('create contract, buy tokens with incorrect sign address, get balance', function () {
        var instance, ICOSince = parseInt(new Date().getTime() / 1000);

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    WrongSigAddress,
                    new BigNumber(10000).mul(2400).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(0).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))
            .then(() => instance.collectedEthers.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(0).valueOf(), 'collectedEthers amount is not equal'))
    });

    it('create contract, buy tokens with correct sign address, check price after SoftCap, check sale period', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000);

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(3000).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))


            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.softCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(3000).mul(precision).valueOf(), 'softCap is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(2400).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(2400).mul(precision).valueOf()))
            .then(() => instance.collectedEthers.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(1000000000000000000).valueOf(), 'collectedEthers amount is not equal'))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400, 'ICOTill is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => tokenContract.totalSupply.call())
            // 2400 + 2000 + bonus; bonus = 3000 - 2400 | 600 = 120 | total = 4520
            .then((result) => assert.equal(result.valueOf(), new BigNumber(4520).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(4520).mul(precision).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400 + 604800, 'ICOTill is not equal'))
    });

    it('create contract, buy tokens with correct sign address before sale period', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000) + 3600;

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(10000).mul(2400).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '0', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))
    });

    it('create contract, buy tokens with correct sign address after sale period', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000) - 3600 * 24 * 32;

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(10000).mul(2400).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), '0', 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))
    });

    it('create contract, buy tokens with correct sign address, try to contribute after hardCap', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000);

        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(3000).mul(precision),//softCap
                    new BigNumber(4520).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => instance.softCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(3000).mul(precision), 'softCap is not equal'))

            .then(() => instance.hardCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(4520).mul(precision), 'hardCap is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(2400).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(2400).mul(precision).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400, 'ICOTill is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => tokenContract.totalSupply.call())
            // 2400 + 2000 + bonus; bonus = 3000 - 2400 | 600 = 120 | total = 4520
            .then((result) => assert.equal(result.valueOf(), new BigNumber(4520).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(4520).mul(precision).valueOf()))

            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), ICOSince + 2678400 + 604800, 'ICOTill is not equal'))

            .then(() => makeTransaction(instance, '1000000000000000000'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(4520).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(4520).mul(precision).valueOf()))
    });

    it('create contract, buy tokens with correct sign address, check ethers transfer', function () {
        var instance, tokenContract, ICOSince = parseInt(new Date().getTime() / 1000);
        return Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )
            .then((_instance) => tokenContract = _instance)
            .then(() => {
                return Uptick.new(
                    etherHolderAddress,
                    SigAddress,
                    new BigNumber(10000).mul(2400).mul(precision),//softCap
                    new BigNumber(50000).mul(2000).mul(precision),//hardCap
                    ICOSince,//_icoSince
                    new BigNumber(500000000000000)//_tokenPrice
                )
            })

            .then((_instance) => instance = _instance)
            .then(() => instance.setUptick(tokenContract.address))
            .then(() => instance.setAllowedMultivest(instance.address))
            .then(() => tokenContract.setUptickICO(instance.address))
            .then(() => tokenContract.addMinter(instance.address))

            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(0).valueOf()))

            .then(() => makeTransaction(instance, '5000000000000000000'))
            .then(() => Utils.receiptShouldSucceed)

            .then(() => tokenContract.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber(12000).mul(precision).valueOf(), 'collected amount is not equal'))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(12000).mul(precision).valueOf()))

            .then(() => {
                contractEthBalance = Utils.getEtherBalance(instance.address);
            })
            .then(() => {
                etherHolderBalance = Utils.getEtherBalance(etherHolderAddress);
            })

            .then(() => instance.transferEthers())

            .then((result) => {
                Utils.receiptShouldSucceed(result);
                return Utils.getTxCost(result);
            })

            .then((result) => Utils.checkEtherBalance(etherHolderAddress, parseFloat(contractEthBalance) + parseFloat(etherHolderBalance)))

            .then(() => {
                Utils.checkEtherBalance(instance.address, 0);
            })
    });

    it('create contract, check multivest buy process', async function () {
        hashLock = true;

        let tokenContract = await Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )

        let icoContract = await Uptick.new(
            etherHolderAddress,
            SigAddress,
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            parseInt(new Date().getTime() / 1000),//_icoSince
            new BigNumber(500000000000000)//_tokenPrice
        )

        await icoContract.setUptick(tokenContract.address)
        await icoContract.setAllowedMultivest(icoContract.address)
        await tokenContract.setUptickICO(icoContract.address)
        await tokenContract.addMinter(icoContract.address)

        await makeTransaction(icoContract, '1000000000000000000')
            .then(() => Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(2400).mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[1], new BigNumber(0).valueOf()))

        await tokenContract.transfer(accounts[1], new BigNumber(1000).mul(precision))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(2400).mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[1], 0))

        await tokenContract.setLockedAddress(accounts[0], false)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

        let checkLockedAddress = await tokenContract.isAddressLocked.call(accounts[0])
        assert.equal(checkLockedAddress.valueOf(), true, "isAddressLocked is not equal")

        await tokenContract.setLockedAddress(accounts[0], false, {from: SigAddress})
            .then(() => Utils.receiptShouldSucceed)

        checkLockedAddress = await tokenContract.isAddressLocked.call(accounts[0])
        assert.equal(checkLockedAddress.valueOf(), false, "isAddressLocked is not equal")

        await tokenContract.transfer(accounts[1], new BigNumber(1000).mul(precision))
            .then(() => Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber(1400).mul(precision).valueOf()))
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[1], new BigNumber(1000).mul(precision).valueOf()))

    })

    it('check setLocked', async function () {
        let tokenContract = await Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )

        let icoContract = await Uptick.new(
            etherHolderAddress,
            SigAddress,
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            parseInt(new Date().getTime() / 1000),//_icoSince
            new BigNumber(500000000000000)//_tokenPrice
        )

        await icoContract.setUptick(tokenContract.address)
        await icoContract.setAllowedMultivest(icoContract.address)
        await tokenContract.setUptickICO(icoContract.address)
        await tokenContract.addMinter(icoContract.address)

        let locked = await tokenContract.locked.call()
        assert.equal(locked.valueOf(), false, 'locked is not equal')

        await tokenContract.setLocked(true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

        locked = await tokenContract.locked.call()
        assert.equal(locked.valueOf(), false, 'locked is not equal')

        await tokenContract.setLocked(true)

        locked = await tokenContract.locked.call()
        assert.equal(locked.valueOf(), true, 'locked is not equal')

    })

    it('create contract, check buy 0 tokens', async function () {
        hashLock = true;

        let tokenContract = await Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )

        let icoContract = await Uptick.new(
            etherHolderAddress,
            SigAddress,
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(50000).mul(2000).mul(precision),//hardCap
            parseInt(new Date().getTime() / 1000),//_icoSince
            new BigNumber(500000000000000)//_tokenPrice
        )

        await icoContract.setUptick(tokenContract.address)
        await icoContract.setAllowedMultivest(icoContract.address)
        await tokenContract.setUptickICO(icoContract.address)
        await tokenContract.addMinter(icoContract.address)

        await makeTransaction(icoContract, '0')
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

    })

    it("create contract & check buy after hardCap", async function () {
        hashLock = true;

        let tokenContract = await Token.new(
            new BigNumber(130000000).mul(precision),//maxSupply
            'TIC',
            'TIC',
            18,
            false
        )

        let icoContract = await Uptick.new(
            etherHolderAddress,
            SigAddress,
            new BigNumber(10000).mul(2400).mul(precision),//softCap
            new BigNumber(3000).mul(precision),//hardCap
            parseInt(new Date().getTime() / 1000),//_icoSince
            new BigNumber(500000000000000)//_tokenPrice
        )

        await icoContract.setUptick(tokenContract.address)
        await icoContract.setAllowedMultivest(icoContract.address)
        await tokenContract.setUptickICO(icoContract.address)
        await tokenContract.addMinter(icoContract.address)

        await makeTransaction(icoContract, '1000000000000000000')
            .then(() => Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber("2400").mul(precision).valueOf()))

        let totalSupply = await tokenContract.totalSupply()
        assert.equal(totalSupply.valueOf(), new BigNumber("2400").mul(precision).valueOf(), 'totalSupply is not equal')

        await makeTransaction(icoContract, '1000000000000000000')
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(tokenContract, accounts[0], new BigNumber("2400").mul(precision).valueOf()))

    });

});