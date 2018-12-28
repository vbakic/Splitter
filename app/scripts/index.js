// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import SplitterArtifact from '../../build/contracts/Splitter.json'
const Splitter = contract(SplitterArtifact)
const Promise = require("bluebird");
const assert = require('assert-plus');

var accountNames = ["Alice", "Bob", "Carol", "Jim", "Trevor"]
let accounts
let sender
let receiver1
let receiver2
let instance

window.addEventListener('load', function () {
  window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  web3.eth.getTransactionReceiptMined = require("../../utils/getTransactionReceiptMined.js");
  // Promisify all functions of web3.eth and web3.version
  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
  Promise.promisifyAll(web3.version, { suffix: "Promise" });
  App.start()
  window.App = App
  jQuery("#sender, #receiver1, #receiver2").change(() => {
    App.update();
  })
})

const App = {

  update: function() {
    console.log('update called!')
      sender = accounts[jQuery("#sender").val()]
      receiver1 = accounts[jQuery("#receiver1").val()]
      receiver2 = accounts[jQuery("#receiver2").val()]
  },

  start: async function () {
    const self = this

    // Bootstrap the Splitter abstraction for Use.
    Splitter.setProvider(web3.currentProvider)

    instance = await Splitter.deployed()
    accounts = await web3.eth.getAccountsPromise()

    if (accounts.length < 5){
      throw new Error("No available accounts!");
    }
    else {
      sender = accounts[0]
      receiver1 = accounts[1]
      receiver2 = accounts[2]
      self.refreshBalances()
    }

  },

  refreshBalances: async function () {
    const self = this
    self.refreshAccountBalances()
    let balance = await web3.eth.getBalancePromise(instance.address)
    jQuery('#Splitter').val(convertToEther(balance))
  },

  refreshAccountBalances: async function () {
    for (let [index, element] of accounts.entries()) {
      let balance = await web3.eth.getBalancePromise(element)
      let balanceContract = await instance.getContractBalance({from: element})
      jQuery("#" + accountNames[index]).val(convertToEther(balance))
      jQuery("#" + index).val(convertToEther(balanceContract))
      jQuery("#" + accountNames[index] + "ContractBalance").val(convertToEther(balanceContract))
      jQuery("#" + accountNames[index] + "Address").val(element)
    }
  },

  splitAmount: async function () {
      const self = this
      const amountWei = convertToWei(jQuery("#splitAmount").val())
      if(amountWei > 0) {
        let txHash = await instance.splitAmount.sendTransaction(receiver1, receiver2, { from: sender, value: amountWei })
        console.log("Your transaction is on the way, waiting to be mined!", txHash);
        let receipt = await web3.eth.getTransactionReceiptMined(txHash);
        assert.strictEqual(parseInt(receipt.status), 1);
        console.log("Your transaction executed successfully!");
        if(parseInt(receipt.status) == 1) {
          self.refreshBalances()
        }
      } else {
        console.error("Error: only positive values acceptable!")
      }
  },

  pullEther: async function (accNumber) {
    const self = this
    let result = await instance.pullEther( convertToWei(jQuery("#" + accNumber).val()), { from: accounts[accNumber] })
    self.refreshBalances()
    return result;
  }

}

function convertToEther(value) {
  return web3.fromWei(value.toString(10), "ether");
}

function convertToWei(value) {
  return web3.toWei(value, "ether");
}