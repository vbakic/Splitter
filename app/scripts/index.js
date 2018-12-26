// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import SplitterArtifact from '../../build/contracts/Splitter.json'
const Splitter = contract(SplitterArtifact)
const Promise = require("bluebird");

var accountNames = ["Alice", "Bob", "Carol"]
let accounts
let sender
let receiver1
let receiver2
let instance

window.addEventListener('load', function () {
  window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  // Promisify all functions of web3.eth and web3.version
  Promise.promisifyAll(web3.eth, { suffix: "Promise" });
  Promise.promisifyAll(web3.version, { suffix: "Promise" });
  App.start()
  window.App = App
})

const App = {
  start: async function () {
    const self = this

    // Bootstrap the Splitter abstraction for Use.
    Splitter.setProvider(web3.currentProvider)

    instance = await Splitter.deployed()
    accounts = await web3.eth.getAccountsPromise()

    if (accounts.length == 0){
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
      jQuery("#" + accountNames[index]).val(convertToEther(balance))
    }
  },

  splitAmount: async function () {
      const self = this
      const amountWei = convertToWei(jQuery("#splitAmount").val())
      if(amountWei > 0) {
        let result = await instance.splitAmount(receiver1, receiver2, amountWei, { from: sender })
        if(result) {
          let result1 = await self.pullEther(receiver1)
          let result2 = await self.pullEther(receiver2)
          if(result1 && result2) {
            self.refreshBalances()
          }
        }
      } else {
        console.error("Error: only positive values acceptable!")
      }
  },

  pullEther: async function (account) {
    let result = await instance.pullEther({ from: account })
    return result;
  },

  deposit: async function () {
    const self = this
    let result = await web3.eth.sendTransactionPromise({
        from: sender, 
        to: instance.address,
        value: convertToWei(jQuery("#amountToDeposit").val())
    })
    if(result) {
      self.refreshBalances()
    }
  }
}

function convertToEther(value) {
  return web3.fromWei(value.toString(10), "ether");
}

function convertToWei(value) {
  return web3.toWei(value, "ether");
}