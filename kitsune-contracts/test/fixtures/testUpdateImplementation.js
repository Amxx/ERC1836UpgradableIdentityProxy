const chai   = require('chai');
const ethers = require('ethers');
const { solidity } = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testUpdateImplementation(sdk, name)
{
	describe('UpdateImplementation', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = sdk.provider.getWallets();
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

		it('authorized', async () => {
			const masterAddress = (await sdk.contracts.getActiveInstance(name)).address;

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.nonce()).to.be.eq(0);

			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{
					to: proxy.address,
					data: await sdk.transactions.updateImplementation(
						name,
						sdk.transactions.initialization(
							name,
							[
								[ sdk.utils.addrToKey(user2.address) ],
								[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
								1,
								1,
							]
						),
					),
				},
				{ options: { gasLimit: 1000000 } },
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'Upgraded').withArgs(masterAddress);

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('authorized - dedicated function', async () => {
			const masterAddress = (await sdk.contracts.getActiveInstance(name)).address;

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.nonce()).to.be.eq(0);

			await sdk.contracts.upgradeProxy(
				proxy,
				name,
				[
					[ sdk.utils.addrToKey(user2.address) ],
					[ "0x0000000000000000000000000000000000000000000000000000000000000007" ],
					1,
					1,
				],
				(proxy, tx, config) => sdk.multisig.execute(proxy, [ user1 ], tx, config),
				{ options: { gasLimit: 1000000 } },
			);

			expect(await proxy.getKey(sdk.utils.addrToKey(user1.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
			expect(await proxy.getKey(sdk.utils.addrToKey(user2.address))).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000007');
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('protected', async () => {
			await expect(proxy.connect(user2).execute(
				0,
				proxy.address,
				0,
				await sdk.transactions.updateImplementation(
					name,
					sdk.transactions.initialization(
						name,
						[
							[ sdk.utils.addrToKey(user2.address) ],
							[ "0x000000000000000000000000000000000000000000000000000000000000000f" ],
							1,
							1,
						]
					),
				),
				{ gasLimit: 1000000 }
			)).to.be.revertedWith('access-denied');
		});
	});
}

module.exports = testUpdateImplementation;
