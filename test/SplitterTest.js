const Splitter = artifacts.require("Splitter");

web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
const expectedException = require("../utils/expectedExceptionPromise.js");

contract("Splitter", accounts => {

    const [firstAccount, secondAccount, thirdAccount] = accounts;

    it("should reject deploying contract as killed", async () => {
        await expectedException(() => {
            return Splitter.new(2)
        });
    });

    describe("testing paused contract", function() {

        beforeEach(function(){
            return Splitter.new(1)
            .then(function(instance) {
                splitterPaused = instance;
            });
        });

        it("test resume", async () => {
            await splitterPaused.resumeContract({ from: firstAccount });
            assert.equal(await splitterPaused.getState(), 0);
        });
    
        it("test kill", async () => {
            await splitterPaused.killContract({ from: firstAccount });
            assert.equal(await splitterPaused.getState(), 2);
        });
    
        it("should reject resume from non-owner", async () => {
            await expectedException(() => {
                return splitterPaused.resumeContract({ from: secondAccount });
            });
        });
    
        it("should reject kill from non-owner", async () => {
            await expectedException(() => {
                return splitterPaused.killContract({ from: secondAccount });
            });
        });

        it("should reject split when paused", () => {
            return expectedException(() => {
                return splitterPaused.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            });
        });

    });

    describe("testing running contract", function() {
        beforeEach(function(){
            return Splitter.new(0)
            .then(function(instance) {
                splitterRunning = instance;
            });
        });
    
        it("test getOwner", async () => {
            assert.equal(await splitterRunning.getOwner(), firstAccount);
        });
    
        it("test getState", async () => {
            assert.equal(await splitterRunning.getState(), 0);
        });
    
        it("test changing owner", async () => {
            await splitterRunning.changeOwner(secondAccount, { from: firstAccount });
            assert.equal(await splitterRunning.getOwner(), secondAccount);
        });
    
        it("test pause", async () => {
            await splitterRunning.pauseContract({ from: firstAccount });
            assert.equal(await splitterRunning.getState(), 1);
        });    
    
        it("test split", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            assert.equal(await splitterRunning.balances(thirdAccount), 5);
        });

        it("test split of uneven number", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 3 });
            assert.equal(await splitterRunning.balances(firstAccount), 1);
            assert.equal(await splitterRunning.balances(secondAccount), 1);
            assert.equal(await splitterRunning.balances(thirdAccount), 1);
        });

        it("test split of exactly 1 wei", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 1 });
            assert.equal(await splitterRunning.balances(firstAccount), 1);
            assert.equal(await splitterRunning.balances(secondAccount), 0);
            assert.equal(await splitterRunning.balances(thirdAccount), 0);
        });
    
        it("test withdraw", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            assert.equal(await splitterRunning.balances(thirdAccount), 5);
            await splitterRunning.withdrawEther(5, { from: secondAccount });
            assert.equal(await splitterRunning.balances(secondAccount), 0);
            await splitterRunning.withdrawEther(5, { from: thirdAccount });
            assert.equal(await splitterRunning.balances(thirdAccount), 0);
        });

        it("test withdraw when paused", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            assert.equal(await splitterRunning.balances(thirdAccount), 5);
            await splitterRunning.pauseContract({from: firstAccount}); //pause the contract
            await splitterRunning.withdrawEther(5, { from: secondAccount });
            assert.equal(await splitterRunning.balances(secondAccount), 0);
            await splitterRunning.withdrawEther(5, { from: thirdAccount });
            assert.equal(await splitterRunning.balances(thirdAccount), 0);
        });
    
        it("should reject direct transaction without value", async () => {
            return expectedException(() => {
                return splitterRunning.sendTransaction({ from: firstAccount });
            });
        });
    
        it("should reject direct transaction with value", () => {
            return expectedException(() => {
                return splitterRunning.sendTransaction({ from: firstAccount, value: 10 });
            });
        });
    
        it("should reject split without value", () => {
            return expectedException(() => {
                return splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount });
            });
        });
    
        it("should reject split without receiver addresses", () => {
            return expectedException(() => {
                return splitterRunning.splitEther( 0, 0, { from: firstAccount, value: 10 });
            });
        });
    
        it("should reject split without receiver 1", () => {
            return expectedException(() => {
                return splitterRunning.splitEther( 0, thirdAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split without receiver 2", () => {
            return expectedException(() => {
                return splitterRunning.splitEther( secondAccount, 0, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split to the sender", () => {
            return expectedException(() => {
                return splitterRunning.splitEther( firstAccount, thirdAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split to the sender #2", () => {
            return expectedException(() => {
                return splitterRunning.splitEther( secondAccount, firstAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split to the sender #3", () => {
            return expectedException(() => {
                return splitterRunning.splitEther( firstAccount, firstAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject withdraw without amount", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            await expectedException(() => {
                return splitterRunning.withdrawEther( 0, { from: secondAccount });
            });
        });
    
        it("should reject withdraw without balance", async () => {
            await expectedException(() => {
                return splitterRunning.withdrawEther( 5, { from: secondAccount });
            });
        });

        it("should reject withdraw more than balance", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            await expectedException(() => {
                return splitterRunning.withdrawEther( 20, { from: secondAccount });
            });
        });
    
        it("should reject change owner from non-owner", async () => {
            await expectedException(() => {
                return splitterRunning.changeOwner(thirdAccount, { from: secondAccount });
            });
        });
    
        it("should reject pause from non-owner", async () => {
            await expectedException(() => {
                return splitterRunning.pauseContract({ from: secondAccount });
            });
        });
    
        it("should reject kill if not paused", async () => {
            await expectedException(() => {
                return splitterRunning.killContract({ from: firstAccount });
            });
        });

        it("should reject withdraw when killed", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            await splitterRunning.pauseContract({from: firstAccount}); //pausing the contract
            await splitterRunning.killContract({from: firstAccount}); //killing the contract
            await expectedException(() => {
                return splitterRunning.withdrawEther(5, { from: secondAccount });
            });
        });

    });

    describe("testing killed contract", function() {
        beforeEach( async () => {
            splitter = await Splitter.new(1) //setting initial state to paused because it can't be started as killed
            await splitter.killContract({from: firstAccount}); //killing the contract
        });
    
        it("should reject resume if killed", async () => {
            await expectedException(() => {
                return splitter.resumeContract({ from: firstAccount });
            });
        });
    
        it("should reject pause if killed", async () => {
            await expectedException(() => {
                return splitter.pauseContract({ from: firstAccount });
            });
        });


        it("should reject split when killed", async () => {
            await expectedException(() => {
                return splitter.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            });
        });
    
    });

});


