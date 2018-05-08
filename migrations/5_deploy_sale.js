var Crowdsale = artifacts.require("Crowdsale");
var PickToken = artifacts.require("PickToken");

const moment = require('moment');

module.exports = async function(deployer, network, accounts) {

  const startTime = moment().add(2, 'minutes').unix();
  const endTime = startTime + (14400); // + 1 week
  const rate = new web3.BigNumber(10000000000); //Price: 0.001 ETH
  const wallet = accounts[0];
  var sale;

  deployer.deploy(PickToken, {overwrite: false}).then(function() {
    return deployer.deploy(Crowdsale, startTime, endTime, rate, wallet, PickToken.address);
  });
};