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
let owner

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

  followUpTransaction: async function(txHash) {
    console.log("Your transaction is on the way, waiting to be mined!", txHash);
    let receipt = await web3.eth.getTransactionReceiptMined(txHash);
    assert.strictEqual(parseInt(receipt.status), 1);
    console.log("Your transaction executed successfully!");
    return true;
  },

  pauseSplitter: async function () {
    let txHash = await instance.pauseContract.sendTransaction({from: owner})
    let success = await this.followUpTransaction(txHash);
    if(success) {
      jQuery("#contractState").html("Paused");
    }    
  },

  resumeSplitter: async function () {
    let txHash = await instance.resumeContract.sendTransaction({from: owner})
    let success = await this.followUpTransaction(txHash);
    if(success) {
      jQuery("#contractState").html("Running");
    }
  },

  changeOwner: async function () {
    let index = jQuery("#ownerSelector").val()
    if(accounts[index] != owner) {
      let txHash = await instance.changeOwner.sendTransaction(accounts[index], {from: owner})
      let success = await this.followUpTransaction(txHash);
      if(success) {
        this.refreshOwnerInfo()
      }
    } else {
      console.error("Already that owner")
    }
  },

  refreshOwnerInfo: async function () {
    let ownerAdress = await instance.owner({from: owner})
    for (let [index, element] of accounts.entries()) {
      if(element == ownerAdress) {
        owner = ownerAdress
        jQuery("#currentOwner").val(index)
      }
    }
  },

  refreshBalances: async function () {
    const self = this
    self.refreshAccountBalances()
    self.updateContractState()
    self.refreshOwnerInfo()
    const balance = await web3.eth.getBalancePromise(instance.address)
    jQuery('#Splitter').val(convertToEther(balance))
  },

  updateContractState: async function () {
    let contractState = await instance.isRunning({from: owner})
    if(contractState) {
      jQuery('#contractState').html("Running")
    } else {
      jQuery('#contractState').html("Paused")
    }    
  },

  refreshAccountBalances: async function () {
    for (let [index, element] of accounts.entries()) {
      const balance = await web3.eth.getBalancePromise(element)
      const balanceContract = await instance.balances(element)
      jQuery("#" + accountNames[index]).val(convertToEther(balance))
      jQuery("#" + index).val(convertToEther(balanceContract))
      jQuery("#" + accountNames[index] + "ContractBalance").val(convertToEther(balanceContract))
      jQuery("#" + accountNames[index] + "Address").val(element)
    }
  },

  splitEther: async function () {
      const self = this
      const amountWei = convertToWei(jQuery("#splitAmount").val())
      if(amountWei > 0) {
        let txHash = await instance.splitEther.sendTransaction(receiver1, receiver2, { from: sender, value: amountWei })
        let success = await this.followUpTransaction(txHash);
        if(success) {
          self.refreshBalances()
        }
      } else {
        console.error("Error: only positive values acceptable!")
      }
  },

  withdrawEther: async function (accNumber) {
    const self = this
    let amountToWithdraw = jQuery("#" + accNumber).val()
    if(amountToWithdraw > 0) {
        let txHash = await instance.withdrawEther.sendTransaction( convertToWei(amountToWithdraw), { from: accounts[accNumber] })
        let success = await this.followUpTransaction(txHash);
        if(success) {
          self.refreshBalances()
        }
    } else {
        console.error("Withdrawal amount has to be greater than 0")
    }
    
  }

}

function convertToEther(value) {
  return web3.fromWei(value.toString(10), "ether");
}

function convertToWei(value) {
  return web3.toWei(value, "ether");
}