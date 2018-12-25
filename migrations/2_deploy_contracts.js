/* var ConvertLib = artifacts.require('./ConvertLib.sol')
var MetaCoin = artifacts.require('./MetaCoin.sol')

module.exports = function (deployer) {
  deployer.deploy(ConvertLib)
  deployer.link(ConvertLib, MetaCoin)
  deployer.deploy(MetaCoin)
}
 */

var Splitter = artifacts.require('./Splitter.sol')
module.exports = function (deployer) {
  deployer.deploy(Splitter)
}
