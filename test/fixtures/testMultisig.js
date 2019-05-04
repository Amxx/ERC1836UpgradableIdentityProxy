const chai   = require('chai');
const ethers = require('ethers');
const {getWallets, solidity} = require('ethereum-waffle');
const {relayMetaTx,prepareMetaTx} = require('../../utils/utils.js');

const {expect} = chai;
chai.use(solidity);

function testMultisig(provider, executeabi, addrToKey = ethers.utils.keccak256)
{
	const [ wallet, relayer, user1, user2, user3 ] = getWallets(provider);
	const dest = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));

	describe('Multisig', async () => {

		describe('Nonce', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.nonce()).to.be.eq(0);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{ to: dest, nonce: 1 },
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

				expect(await proxyAsWallet.nonce()).to.be.eq(1);
			});

			it('invalid', async () => {
				expect(await proxyAsWallet.nonce()).to.be.eq(0);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{ to: dest, nonce: 2 },
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.be.revertedWith('invalid-nonce');

				expect(await proxyAsWallet.nonce()).to.be.eq(0);
			});

			it('replay protection', async () => {
				expect(await proxyAsWallet.nonce()).to.be.eq(0);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{ to: dest, nonce: 1 },
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);

				expect(await proxyAsWallet.nonce()).to.be.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{ to: dest, nonce: 1 },
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.be.revertedWith('invalid-nonce');

				expect(await proxyAsWallet.nonce()).to.be.eq(1);
			});
		});

		describe('Change management threshold', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setKey.encode([
								addrToKey(user2.address),
								'0x0000000000000000000000000000000000000000000000000000000000000001',
							]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(1, 2);

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(2);
			});

			it('invalid (too low)', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([0]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'threshold-too-low');

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			});

			it('invalid (too high)', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'threshold-too-high');

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			});
		});

		describe('Manage with multiple signatures', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setKey.encode([
								addrToKey(user2.address),
								'0x0000000000000000000000000000000000000000000000000000000000000001',
							]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(1, 2);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([1]),
						},
						[ user1, user2 ],
						executeabi,
					),
					relayer,
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(2, 1);

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);
			});

			it('invalid', async () => {
				expect(await proxyAsWallet.getManagementThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setKey.encode([
								addrToKey(user2.address),
								'0x0000000000000000000000000000000000000000000000000000000000000001',
							]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ManagementThresholdChange').withArgs(1, 2);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setManagementThreshold.encode([1]),
						},
						[ user2 ],
						executeabi,
					),
					relayer,
				)).to.be.revertedWith('missing-signers');

				expect(await proxyAsWallet.getManagementThreshold()).to.eq(2);
			});
		});

		describe('Change execution threshold', async () => {
			it('valid', async () => {
				expect(await proxyAsWallet.getActionThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setActionThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to
				.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address)
				.emit(proxyAsWallet, 'ActionThresholdChange').withArgs(1, 2);

				expect(await proxyAsWallet.getActionThreshold()).to.eq(2);
			});

			it('invalid', async () => {
				expect(await proxyAsWallet.getActionThreshold()).to.eq(1);

				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setActionThreshold.encode([0]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallFailure'); //.withArgs(proxyAsWallet.address, 'threshold-too-low');

				expect(await proxyAsWallet.getActionThreshold()).to.eq(1);
			});
		});

		describe('Execute with multiple signatures', async () => {
			it('valid', async () => {
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setKey.encode([
								addrToKey(user2.address),
								'0x0000000000000000000000000000000000000000000000000000000000000006'
							]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setActionThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: dest,
						},
						[ user1, user2 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: dest,
						},
						[ user2, user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(dest);
			});

			it('invalid - unauthorized signer', async () => {
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setActionThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: dest,
						},
						[ user1, user2 ],
						executeabi,
					),
					relayer,
				)).to.be.revertedWith('invalid-signature');
			});

			it('invalid - multiple signer', async () => {
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: proxyAsWallet.address,
							data: proxyAsWallet.interface.functions.setActionThreshold.encode([2]),
						},
						[ user1 ],
						executeabi,
					),
					relayer,
				)).to.emit(proxyAsWallet, 'CallSuccess').withArgs(proxyAsWallet.address);
				await expect(relayMetaTx(
					await prepareMetaTx(
						proxyAsWallet,
						{
							to: dest,
						},
						[ user1, user1 ],
						executeabi,
					),
					relayer,
				)).to.be.revertedWith('invalid-signatures-ordering');
			});
		});
	});
}

module.exports = testMultisig;
