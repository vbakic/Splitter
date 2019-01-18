const Splitter = artifacts.require("Splitter");

web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");
const expectedException = require("../utils/expectedExceptionPromise.js");

const [Running, Paused, Killed] = [0, 1, 2];

function checkIfSuccessfulTransaction(tx) {
    return assert.equal(tx.receipt.status, 1);
}

contract("Splitter", accounts => {

    const [firstAccount, secondAccount, thirdAccount] = accounts;

    it("should reject deploying contract as killed", async () => {
        await expectedException(() => {
            return Splitter.new(Killed)
        });
    });

    describe("testing paused contract", function() {
        let splitterPaused;
        beforeEach(async() => {
            splitterPaused = await Splitter.new(Paused);
        });

        it("test resume", async () => {
            let tx = await splitterPaused.resumeContract({ from: firstAccount });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterPaused.getState(), 0);
        });
    
        it("test kill", async () => {
            let tx = await splitterPaused.killContract({ from: firstAccount });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterPaused.getState(), 2);
        });
    
        it("should reject resume from non-owner", async () => {
            await expectedException(async() => {
                await splitterPaused.resumeContract({ from: secondAccount });
            });
        });
    
        it("should reject kill from non-owner", async () => {
            await expectedException(async() => {
                await splitterPaused.killContract({ from: secondAccount });
            });
        });

        it("should reject split when paused", async() => {
            await expectedException(async() => {
                await splitterPaused.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            });
        });

    });

    describe("testing running contract", function() {
        let splitterRunning;
        beforeEach(async() => {
            splitterRunning = await Splitter.new(Running);
        });
    
        it("test getOwner", async () => {
            assert.equal(await splitterRunning.getOwner(), firstAccount);
        });
    
        it("test getState", async () => {
            assert.equal(await splitterRunning.getState(), 0);
        });
    
        it("test changing owner", async () => {
            let tx = await splitterRunning.changeOwner(secondAccount, { from: firstAccount });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterRunning.getOwner(), secondAccount);
        });
    
        it("test pause", async () => {
            let tx = await splitterRunning.pauseContract({ from: firstAccount });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterRunning.getState(), 1);
        });    
    
        it("test split", async () => {
            let tx = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            assert.equal(await splitterRunning.balances(thirdAccount), 5);
        });

        it("test two consecutive splits", async () => {
            let tx1 = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            checkIfSuccessfulTransaction(tx1);
            let tx2 = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            checkIfSuccessfulTransaction(tx2);
            assert.equal(await splitterRunning.balances(secondAccount), 10);
            assert.equal(await splitterRunning.balances(thirdAccount), 10);
        });

        it("test split of uneven number", async () => {
            let tx = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 3 });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterRunning.balances(firstAccount), 1);
            assert.equal(await splitterRunning.balances(secondAccount), 1);
            assert.equal(await splitterRunning.balances(thirdAccount), 1);
        });

        it("test split of exactly 1 wei", async () => {
            let tx = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 1 });
            checkIfSuccessfulTransaction(tx);
            assert.equal(await splitterRunning.balances(firstAccount), 1);
            assert.equal(await splitterRunning.balances(secondAccount), 0);
            assert.equal(await splitterRunning.balances(thirdAccount), 0);
        });
    
        it("test withdraw", async () => {
            let tx1 = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            checkIfSuccessfulTransaction(tx1);
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            assert.equal(await splitterRunning.balances(thirdAccount), 5);
            let tx2 = await splitterRunning.withdrawEther(5, { from: secondAccount });
            checkIfSuccessfulTransaction(tx2);
            assert.equal(await splitterRunning.balances(secondAccount), 0);
            let tx3 = await splitterRunning.withdrawEther(5, { from: thirdAccount });
            checkIfSuccessfulTransaction(tx3);
            assert.equal(await splitterRunning.balances(thirdAccount), 0);
        });

        it("test withdraw when paused", async () => {
            let tx1 = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            checkIfSuccessfulTransaction(tx1);
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            assert.equal(await splitterRunning.balances(thirdAccount), 5);
            let tx2 = await splitterRunning.pauseContract({from: firstAccount}); //pause the contract
            checkIfSuccessfulTransaction(tx2);
            let tx3 = await splitterRunning.withdrawEther(5, { from: secondAccount });
            checkIfSuccessfulTransaction(tx3);
            assert.equal(await splitterRunning.balances(secondAccount), 0);
            let tx4 = await splitterRunning.withdrawEther(5, { from: thirdAccount });
            checkIfSuccessfulTransaction(tx4);
            assert.equal(await splitterRunning.balances(thirdAccount), 0);
        });
    
        it("should reject direct transaction without value", async () => {
            await expectedException(async() => {
                await splitterRunning.sendTransaction({ from: firstAccount });
            });
        });
    
        it("should reject direct transaction with value", async() => {
            await expectedException(async() => {
                await splitterRunning.sendTransaction({ from: firstAccount, value: 10 });
            });
        });
    
        it("should reject split without value", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount });
            });
        });
    
        it("should reject split without receiver addresses", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther( 0, 0, { from: firstAccount, value: 10 });
            });
        });
    
        it("should reject split without receiver 1", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther( 0, thirdAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split without receiver 2", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther( secondAccount, 0, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split to the sender", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther( firstAccount, thirdAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split to the sender #2", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther( secondAccount, firstAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject split to the sender #3", async() => {
            await expectedException(async() => {
                await splitterRunning.splitEther( firstAccount, firstAccount, { from: firstAccount, value: 10 });
            });
        });

        it("should reject withdraw without amount", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            await expectedException(async() => {
                await splitterRunning.withdrawEther( 0, { from: secondAccount });
            });
        });
    
        it("should reject withdraw without balance", async () => {
            await expectedException(async() => {
                await splitterRunning.withdrawEther( 5, { from: secondAccount });
            });
        });

        it("should reject withdraw more than balance", async () => {
            await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            await expectedException(async() => {
                await splitterRunning.withdrawEther( 20, { from: secondAccount });
            });
        });
    
        it("should reject change owner from non-owner", async () => {
            await expectedException(async() => {
                await splitterRunning.changeOwner(thirdAccount, { from: secondAccount });
            });
        });
    
        it("should reject pause from non-owner", async () => {
            await expectedException(async() => {
                await splitterRunning.pauseContract({ from: secondAccount });
            });
        });
    
        it("should reject kill if not paused", async () => {
            await expectedException(async() => {
                await splitterRunning.killContract({ from: firstAccount });
            });
        });

        it("should reject withdraw when killed", async () => {
            let tx1 = await splitterRunning.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            checkIfSuccessfulTransaction(tx1);
            assert.equal(await splitterRunning.balances(secondAccount), 5);
            let tx2 = await splitterRunning.pauseContract({from: firstAccount}); //pausing the contract
            checkIfSuccessfulTransaction(tx2);
            let tx3 = await splitterRunning.killContract({from: firstAccount}); //killing the contract
            checkIfSuccessfulTransaction(tx3);
            await expectedException(() => {
                return splitterRunning.withdrawEther(5, { from: secondAccount });
            });
        });

    });

    describe("testing killed contract", function() {
        beforeEach( async () => {
            splitter = await Splitter.new(Paused) //setting initial state to paused because it can't be started as killed
            await splitter.killContract({from: firstAccount}); //killing the contract
        });
    
        it("should reject resume if killed", async () => {
            await expectedException(async() => {
                await splitter.resumeContract({ from: firstAccount });
            });
        });
    
        it("should reject pause if killed", async () => {
            await expectedException(async() => {
                await splitter.pauseContract({ from: firstAccount });
            });
        });


        it("should reject split when killed", async () => {
            await expectedException(async() => {
                await splitter.splitEther(secondAccount, thirdAccount, { from: firstAccount, value: 10 });
            });
        });
    
    });

});


