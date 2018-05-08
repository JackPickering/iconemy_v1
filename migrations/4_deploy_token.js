var PickToken = artifacts.require("PickToken");

module.exports = async function(deployer, network, accounts) {
  var name = "freds_token";
  var symbol = "FTK";
  var decimals = 5;	

  deployer.deploy(PickToken, name, symbol, decimals, {overwrite: false});
};