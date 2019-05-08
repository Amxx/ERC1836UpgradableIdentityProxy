const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');

const {expect} = chai;
chai.use(solidity);

function testOutOfOrder(sdk)
{
	describe('testOutOfOrder', async () => {

		const [ wallet, relayer, user1, user2, user3 ] = getWallets(sdk.provider);
		const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

		it('valid nonce', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 1 },
				{ options: { gasLimit: 1000000 } },
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('invalid nonce', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 2 },
				{ options: { gasLimit: 1000000 } },
			)).to.be.revertedWith('invalid-nonce');
			expect(await proxy.nonce()).to.be.eq(0);
		});

		it('out-of-order with salt', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 0 },
				{ options: { gasLimit: 1000000 } },
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('out-of-order with salt (multiple)', async () => {
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 0 },
				{ options: { gasLimit: 1000000 } },
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 0 },
				{ options: { gasLimit: 1000000 } },
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			expect(await proxy.nonce()).to.be.eq(2);
		});

		it('out-of-order replay protection', async () => {
			samesalt = ethers.utils.randomBytes(32);
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 0, salt: samesalt },
				{ options: { gasLimit: 1000000 } },
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 0, salt: samesalt },
				{ options: { gasLimit: 1000000 } },
			)).to.revertedWith('transaction-replay');
			expect(await proxy.nonce()).to.be.eq(1);
		});

		it('out-of-order replay protection (different signers)', async () => {
			samesalt = ethers.utils.randomBytes(32);
			expect(await proxy.nonce()).to.be.eq(0);
			await expect(sdk.multisig.setKey(
				proxy,
				[ user1 ],
				sdk.utils.addrToKey(user2.address),
				'0x0000000000000000000000000000000000000000000000000000000000000007',
				{ options: { gasLimit: 1000000 } },
			)).to
			.emit(proxy, 'CallSuccess').withArgs(proxy.address)
			.emit(proxy, 'SetKey').withArgs(sdk.utils.addrToKey(user2.address), "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000007");
			await expect(sdk.multisig.execute(
				proxy,
				[ user1 ],
				{ to: dest, nonce: 0, salt: samesalt },
				{ options: { gasLimit: 1000000 } },
			)).to.emit(proxy, 'CallSuccess').withArgs(dest);
			await expect(sdk.multisig.execute(
				proxy,
				[ user2 ],
				{ to: dest, nonce: 0, salt: samesalt },
				{ options: { gasLimit: 1000000 } },
			)).to.revertedWith('transaction-replay');
			expect(await proxy.nonce()).to.be.eq(2);
		});

	});
}

module.exports = testOutOfOrder;