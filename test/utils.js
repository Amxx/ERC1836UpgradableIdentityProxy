module.exports = {

	addressToBytes32: function(address)
	{
		return web3.utils.keccak256(address);
	},

	prepareData: function(target, method, args)
	{
		return web3.eth.abi.encodeFunctionCall(target.abi.filter(e => e.type == "function" && e.name == method)[0], args);
	},

	signMetaTX_Multisig: function(identity, metatx, signer)
	{
		return new Promise(async (resolve, reject) => {
			if (metatx.from     == undefined) metatx.from     = identity.address;
			if (metatx.value    == undefined) metatx.value    = 0;
			if (metatx.data     == undefined) metatx.data     = "";
			// if (metatx.nonce    == undefined) metatx.nonce    = Number(await identity.nonce()) + 1;
			if (metatx.nonce    == undefined) metatx.nonce    = 0;

			web3.eth.sign(
				web3.utils.keccak256(web3.eth.abi.encodeParameters([
					"address",
					"uint256",
					"address",
					"uint256",
					"bytes32",
					"uint256",
				],[
					metatx.from,
					metatx.type,
					metatx.to,
					metatx.value,
					web3.utils.keccak256(metatx.data) || "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
					metatx.nonce,
				])),
				signer
			)
			.then(signature => {
				if (metatx.signature === undefined)
				{
					metatx.signature = [];
				}
				metatx.signature.push(signature);
				resolve(metatx);
			})
			.catch(reject);
		});
	},

	sendMetaTX_Multisig: function(identity, metatx, signer, relay)
	{
		return new Promise(async (resolve, reject) => {
			this.signMetaTX_Multisig(identity, metatx, signer).then((signedmetatx) => {
				identity.execute(
					signedmetatx.type,
					signedmetatx.to,
					signedmetatx.value,
					signedmetatx.data,
					signedmetatx.nonce,
					signedmetatx.signature,
					{ from : relay }
				)
				.then(resolve)
				.catch(reject);
			})
		});
	},

	signMetaTX_MultisigRefund: function(identity, metatx, signer)
	{
		return new Promise(async (resolve, reject) => {
			if (metatx.from     == undefined) metatx.from     = identity.address;
			if (metatx.value    == undefined) metatx.value    = 0;
			if (metatx.data     == undefined) metatx.data     = [];
			// if (metatx.nonce    == undefined) metatx.nonce    = Number(await identity.nonce()) + 1;
			if (metatx.nonce    == undefined) metatx.nonce    = 0;
			if (metatx.gasPrice == undefined) metatx.gasPrice = 0;
			if (metatx.gasToken == undefined) metatx.gasToken = "0x0000000000000000000000000000000000000000";

			web3.eth.sign(
				web3.utils.keccak256(web3.eth.abi.encodeParameters([
					"address",
					"uint256",
					"address",
					"uint256",
					"bytes32",
					"uint256",
					"address",
					"uint256",
				],[
					metatx.from,
					metatx.type,
					metatx.to,
					metatx.value,
					web3.utils.keccak256(metatx.data) || "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
					metatx.nonce,
					metatx.gasToken,
					metatx.gasPrice,
				])),
				signer
			)
			.then(signature => {
				if (metatx.signature === undefined)
				{
					metatx.signature = [];
				}
				metatx.signature.push(signature);
				resolve(metatx);
			})
			.catch(reject);
		});
	},

	sendMetaTX_MultisigRefund: function(identity, metatx, signer, relay)
	{
		return new Promise(async (resolve, reject) => {
			this.signMetaTX_MultisigRefund(identity, metatx, signer).then((signedmetatx) => {
				identity.execute(
					signedmetatx.type,
					signedmetatx.to,
					signedmetatx.value,
					signedmetatx.data,
					signedmetatx.nonce,
					signedmetatx.gasToken,
					signedmetatx.gasPrice,
					signedmetatx.signature,
					{ from : relay }
				)
				.then(resolve)
				.catch(reject);
			})
		});
	},
}
