var Crowdsale = artifacts.require("Crowdsale");
var PickToken = artifacts.require("PickToken");

module.exports = async function(deployer, network, accounts) {
  Crowdsale.deployed().then(function() {
    return Crowdsale.deployed();
  }).then(function(_sale) {
    sale = _sale;
    return PickToken.deployed();
  }).then(function(token) {
    return token.transferOwnership(sale.address);
  });
};