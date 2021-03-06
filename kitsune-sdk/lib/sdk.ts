import { ethers }     from 'ethers';
import * as types     from "./typings/all";
import * as contracts from './contracts';

import { Contracts    } from "./modules/Contracts";
import { Multisig     } from "./modules/Multisig";
import { Ownable      } from "./modules/Ownable";
import { Transactions } from "./modules/Transactions";
import { Utils        } from "./modules/Utils";

ethers.errors.setLogLevel('error');

export class SDK
{
	provider: types.provider;
	wallet:   types.wallet;
	ABIS:     types.map<string, {}>;

	// modules
	contracts:    Contracts;
	multisig:     Multisig;
	ownable:      Ownable;
	transactions: Transactions;
	utils:        Utils;

	constructor(
		provider: types.provider = null,
		wallet:   types.wallet   = null,
	) {
		this.provider = provider || new ethers.providers.JsonRpcProvider();
		this.wallet   = wallet;
		this.ABIS     = contracts;

		this.contracts    = new Contracts(this);
		this.multisig     = new Multisig(this);
		this.ownable      = new Ownable(this);
		this.transactions = new Transactions(this);
		this.utils        = new Utils(this);
	}
}

export * from './typings/all';
