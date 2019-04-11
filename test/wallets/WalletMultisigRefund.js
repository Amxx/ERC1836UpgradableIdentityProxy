const chai   = require('chai');
const ethers = require('ethers');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');
const {sendMetaTx} = require('../utils.js')

const Proxy  = require('../../build/Proxy');
const Wallet = require('../../build/WalletMultisigRefund');
const Target = require('../../build/Target');

const testInitialize    = require("../fixtures/testInitialize.js");
const testExecute       = require("../fixtures/testExecute.js");
const testRefund        = require("../fixtures/testRefund.js");
const testKeyManagement = require("../fixtures/testKeyManagement.js");
const testMultisig      = require("../fixtures/testMultisig.js");
const testUpdateMaster  = require("../fixtures/testUpdateMaster.js");

ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('Wallet', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);

	before(async () => {
		walletContract = await deployContract(wallet, Wallet, []);
		targetContract = await deployContract(wallet, Target, []);
	});

	beforeEach(async () => {
		proxyContract = await deployContract(wallet, Proxy, [
			walletContract.address,
			walletContract.interface.functions.initialize.encode([
				[
					ethers.utils.keccak256(user1.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			])
		]);
		relayerProxyContract = await deployContract(wallet, Proxy, [
			walletContract.address,
			walletContract.interface.functions.initialize.encode([
				[
					ethers.utils.keccak256(relayer.address),
				],
				[
					'0x0000000000000000000000000000000000000000000000000000000000000007',
				],
				1,
				1,
			])
		]);
		proxyAsWallet = new ethers.Contract(proxyContract.address, Wallet.abi, provider);
		relayerProxyAsWallet = new ethers.Contract(relayerProxyContract.address, Wallet.abi, provider);

		await wallet.sendTransaction({to: proxyAsWallet.address, value: eth(1)});
	});

	testInitialize   (provider, 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])');
	testExecute      (provider, 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])');
	// testRefund       (provider, 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])');
	testKeyManagement(provider, 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])');
	testMultisig     (provider, 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])');
	testUpdateMaster (provider, 'execute(uint256,address,uint256,bytes,uint256,address,uint256,bytes[])');

});
