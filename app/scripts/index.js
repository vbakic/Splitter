// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    );

// Import our contract artifacts and turn them into usable abstractions.
import SplitterArtifact from '../../build/contracts/Splitter.json'

const Splitter = contract(SplitterArtifact)

var accountNames = ["Alice", "Bob", "Carol"]

let accounts
let account

const App = {
  start: function () {
    const self = this

    // Bootstrap the Splitter abstraction for Use.
    Splitter.setProvider(web3.currentProvider)

    // Get the initial accounts balance so they can be displayed.
    web3.eth.getAccounts(function (err, accs) {

      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length === 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
        return
      }

      accounts = accs
      account = accounts[0]

      self.refreshBalances()

    })
  },

  refreshBalances: async function () {
    const self = this
    self.refreshAccountBalances() 
    let instance = await Splitter.deployed()
    let balance = await promisify(cb => web3.eth.getBalance(instance.address, cb))
    jQuery('#Splitter').val(convertToEther(balance))
  },

  refreshAccountBalances: async function () {
    for (let [index, element] of accounts.entries()) {
      let balance = await promisify(cb => web3.eth.getBalance(element, cb))
      jQuery("#" + accountNames[index]).val(convertToEther(balance))
    } 
  },

  splitAmount: async function () {
      const self = this
      const amountWei = convertToWei(jQuery("#splitAmount").val())
      if(amountWei > 0) {
        let instance = await Splitter.deployed()
        let result = await instance.splitAmount(accounts[1], accounts[2], amountWei, { from: account })
        if(result) {
          self.refreshBalances()
        }
      } else {
        console.error("Error: only positive values acceptable!")
      }
  },

  deposit: async function () {
    const self = this
    let instance = await Splitter.deployed()
    let result = await promisify(
        cb => web3.eth.sendTransaction({
            from: account, 
            to: instance.address,
            value: convertToWei(jQuery("#amountToDeposit").val())
        }, cb))
    if(result) {
      self.refreshBalances()
    }
  }
}

window.App = App

window.addEventListener('load', function () {
  window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  App.start()
})

function convertToEther(value) {
  return web3.fromWei(value.toString(10), "ether");
}

function convertToWei(value) {
  return web3.toWei(value, "ether");
}