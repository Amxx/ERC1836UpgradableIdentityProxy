const chai = require('chai');
const ethers = require('ethers');
const { SDK } = require('@kitsune-wallet/sdk/dist/sdk');
const {createMockProvider, deployContract, getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);
ethers.errors.setLogLevel('error');

eth = x => ethers.utils.parseEther(x.toString())
describe('ContractType', () => {

	const provider = createMockProvider();
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const sdk = new SDK(provider, relayer);

	before(async () => {
		walletContract = await sdk.contracts.getActiveInstance("WalletOwnable", { deploy: { enable: true } });
	});

	beforeEach(async () => {
		proxy        = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ]);
		anotherProxy = await sdk.contracts.deployProxy("WalletOwnable", [ user1.address ]);
	});

	describe('Verify contract type', async () => {

		it('Can use a master as an implementation', async () => {
			await expect(sdk.contracts.deployContract("Proxy", [
				walletContract.address,
				sdk.transactions.initialization("WalletOwnable", [ user1.address ])
			])).to.not.reverted;
		});

		it('Cant use another proxy as an implementation', async () => {
			await expect(sdk.contracts.deployContract("Proxy", [
				anotherProxy.address,
				sdk.transactions.initialization("WalletOwnable", [ user1.address ])
			])).to.be.revertedWith("invalid-master-implementation");
		});

		it('Cant upgrade using another proxy as an implementation', async () => {
			await expect(proxy.connect(user1).updateImplementation(
				anotherProxy.address,
				sdk.transactions.initialization("WalletOwnable", [ user2.address ]),
				true,
				{ gasLimit: 800000 }
			)).to.be.revertedWith("invalid-master-implementation");
		});

		it('Cant upgrade a proxy to use itself', async () => {
			await expect(proxy.connect(user1).updateImplementation(
				proxy.address,
				sdk.transactions.initialization("WalletOwnable", [ user2.address ]),
				true,
				{ gasLimit: 800000 }
			)).to.be.revertedWith("invalid-master-implementation");
		});

	});

});
