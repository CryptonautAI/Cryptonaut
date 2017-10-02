var Uptick = artifacts.require('./Uptick.sol');

module.exports = function(deployer) {
  deployer.deploy(Uptick);
};