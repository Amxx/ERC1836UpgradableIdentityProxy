const   chai     = require('chai');
const { expect } = chai;
const { ethers } = require('ethers');
const { createMockProvider, getWallets, solidity} = require('ethereum-waffle');

const { Sdk }    = require('../utils/sdk');

chai.use(solidity);
ethers.errors.setLogLevel('error');



// const provider = new ethers.providers.JsonRpcProvider();
// const accounts = [
//   "<privatekey_0>"
// , "<privatekey_1>"
// , "<privatekey_2>"
// , "<privatekey_3>"
// , "<privatekey_4>"
// , "<privatekey_5>"
// , "<privatekey_6>"
// , "<privatekey_7>"
// , "<privatekey_8>"
// , "<privatekey_9>"
// ].map(pk => new ethers.Wallet(pk, provider));
// const [ relayer, user1, user2, user3 ] = accounts;

const provider = createMockProvider();
const [ relayer, user1, user2, user3 ] = getWallets(provider);

provider.ready.then(async ({ chainId, name }) => {

	const sdk = new Sdk(provider, relayer);

	// // ------------------------ Check master deployments ------------------------
	// for (let master of sdk.masterList)
	// {
	// 	let instance = await sdk.deployMasterIfNotExist(master);
	// 	if (instance !== null)
	// 	{
	// 		console.log(`${master} not found on chain '${name}' (${chainId}).`)
	// 		console.log(`→ new instance deployed at address ${instance['address']}`);
	// 		console.log(`---`);
	// 	}
	// }


	// ------------------------------ create proxy ------------------------------
	let proxy = null;

	{
		console.log("Deploying proxy: WalletOwnable\n");

		proxy = await sdk.deployProxy("WalletOwnable", [ user1.address ]);

		console.log(`proxy    : ${proxy.address}`         );
		console.log(`master   : ${await proxy.master()}`  );
		console.log(`masterId : ${await proxy.masterId()}`);
		console.log(`owner    : ${await proxy.owner()}`   );
		console.log("");
	}

	// ----------------- master: WalletOwnable → WalletMultisig -----------------
	{
		console.log("\nUpdating proxy: WalletOwnable → WalletMultisig\n");

		let updateMasterTx = sdk.makeUpdateTx(
			[
				(await sdk.getMasterInstance("WalletMultisig")).address,
				sdk.makeInitializationTx(
					"WalletMultisig",
					[
						[ ethers.utils.hexZeroPad(user1.address, 32).toString().toLowerCase() ],
						[ "0x0000000000000000000000000000000000000000000000000000000000000001" ],
						1,
						1,
					]
				),
				true,
			]
		);

		await (await proxy.connect(user1).execute(0, proxy.address, 0, updateMasterTx, { gasLimit: 800000 })).wait();

		proxy = sdk.viewContract("WalletMultisig", proxy.address);

		console.log(`proxy      : ${proxy.address}`         );
		console.log(`master     : ${await proxy.master()}`  );
		console.log(`masterId   : ${await proxy.masterId()}`);
		console.log(`owner      : ${await proxy.owner()}`   );
		console.log(`getKey(U1) : ${await proxy.functions['getKey(address)'](user1.address)}`);
		console.log(`getKey(U2) : ${await proxy.functions['getKey(address)'](user2.address)}`);
		console.log(`getKey(U3) : ${await proxy.functions['getKey(address)'](user3.address)}`);
	}

	// -------- master: WalletMultisig → WalletMultisigRefundOutOfOrder ---------
	{
		console.log("\nUpdating proxy: WalletMultisig → WalletMultisigRefundOutOfOrder\n");

		let updateMasterTx = sdk.makeUpdateTx(
			[
				(await sdk.getMasterInstance("WalletMultisigRefundOutOfOrder")).address,
				"0x",  // no initialization
				false, // no reset (memory pattern are compatible)
			]
		);

		await sdk.relayMetaTx(
			await sdk.prepareMetaTx(
				proxy,                                                    // proxy
				{ to: proxy.address, data: updateMasterTx },              // tx
				[ user1 ],                                                // signer
			)
		);

		proxy = sdk.viewContract("WalletMultisigRefundOutOfOrder", proxy.address);

		console.log(`proxy      : ${proxy.address}`         );
		console.log(`master     : ${await proxy.master()}`  );
		console.log(`masterId   : ${await proxy.masterId()}`);
		console.log(`owner      : ${await proxy.owner()}`   );
		console.log(`getKey(U1) : ${await proxy.functions['getKey(address)'](user1.address)}`);
		console.log(`getKey(U2) : ${await proxy.functions['getKey(address)'](user2.address)}`);
		console.log(`getKey(U3) : ${await proxy.functions['getKey(address)'](user3.address)}`);
	}

});