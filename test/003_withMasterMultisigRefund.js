const Proxy                = artifacts.require("Proxy");
const WalletMultisigRefund = artifacts.require("WalletMultisigRefund");
const TargetContract       = artifacts.require("TargetContract");

const { shouldFail } = require('openzeppelin-test-helpers');
const utils          = require('./utils.js');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('WalletMultisigRefund', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	relayer = accounts[0];
	user1   = accounts[1];
	user2   = accounts[2];

	var ident = null;
	var dest1 = web3.utils.randomHex(20);

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);
		Target = await TargetContract.deployed();
	});

	it ("Create proxy", async () => {
		let { address } = await Proxy.new(
			(await WalletMultisigRefund.deployed()).address,
			utils.prepareData(WalletMultisigRefund, "initialize", [
				[ utils.addressToBytes32(user1) ],
				[ "0x0000000000000000000000000000000000000000000000000000000000000003" ],
				1,
				1
			]),
			{ from: relayer }
		);
		ident = await WalletMultisigRefund.at(address);
	});

	it ("Verify proxy initialization", async () => {
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isTrue (await ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isFalse(await ident.keyHasPurpose(utils.addressToBytes32(user1), "0x0000000000000000000000000000000000000000000000000000000000000004"));
		assert.isFalse(await ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000001"));
		assert.isFalse(await ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000002"));
		assert.isFalse(await ident.keyHasPurpose(utils.addressToBytes32(user2), "0x0000000000000000000000000000000000000000000000000000000000000004"));
	});

	it("Deposit on proxy", async () => {
		assert.equal(await web3.eth.getBalance(ident.address), 0);
		txMined = await ident.send(web3.utils.toWei("1.00", "ether"), { from: user1 });
		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("1.00", "ether"));
	});

	it("Execute - Pay with proxy", async () => {
		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("1.00", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.00", "ether"));

		await utils.sendMetaTX_MultisigRefund(
			ident,
			{
				type:  0,
				to:    dest1,
				value: web3.utils.toWei("0.50", "ether"),
				data:  [],
				// nonce: 1
			},
			user1,
			relayer
		);

		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("0.50", "ether"));
		assert.equal(await web3.eth.getBalance(dest1        ), web3.utils.toWei("0.50", "ether"));
	});

	it("Execute - Call with proxy", async () => {
		randomdata = web3.utils.randomHex(32);

		await utils.sendMetaTX_MultisigRefund(
			ident,
			{
				type:  0,
				to:    Target.address,
				value: 0,
				data:  utils.prepareData(TargetContract, "call", [ randomdata ]),
				// nonce: 2
			},
			user1,
			relayer
		);

		assert.equal(await Target.lastSender(), ident.address);
		assert.equal(await Target.lastData(),   randomdata);
	});

	it("Unauthorized execute", async () => {
		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("0.50", "ether"));

		await shouldFail.reverting(utils.sendMetaTX_MultisigRefund(
			ident,
			{
				type:  0,
				to:    user2,
				value: 0,
				data:  utils.prepareData(TargetContract, "call", [ randomdata ]),
				// nonce: 3
			},
			user2,
			relayer
		));

		assert.equal(await web3.eth.getBalance(ident.address), web3.utils.toWei("0.50", "ether"));
	});

});