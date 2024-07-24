const Messager = artifacts.require("Messager");

module.exports = function(deployer) {
  // Deploy the Messager
  deployer.deploy(Messager);
};