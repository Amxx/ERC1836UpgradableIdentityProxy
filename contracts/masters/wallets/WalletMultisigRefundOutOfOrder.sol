pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../../../node_modules/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../../ENS/ENSRegistered.sol";
import "../ERC725Base.sol";
import "../MasterKeysBase.sol";


contract WalletMultisigRefundOutOfOrder is ERC725Base, MasterKeysBase, ENSRegistered
{
	// This is a delegate contract, lock it
	constructor()
	public
	{
	}

	function execute
	( uint256        _operationType
	, address        _to
	, uint256        _value
	, bytes   memory _data
	, uint256        _nonce
	, bytes32        _salt
	, address        _gasToken
	, uint256        _gasPrice
	, bytes[] memory _sigs
	)
	public
	{
		uint256 gasBefore = gasleft();

		++m_nonce;
		require(_nonce == 0 || _nonce == m_nonce, "invalid-nonce");

		bytes32 neededPurpose;
		if (_to == address(this))
		{
			require(_sigs.length >= m_managementThreshold, "missing-signers");
			neededPurpose = PURPOSE_MANAGEMENT;
		}
		else
		{
			require(_sigs.length >= m_actionThreshold, "missing-signers");
			neededPurpose = PURPOSE_ACTION;
		}

		bytes32 executionID = keccak256(abi.encodePacked(
				address(this),
				_operationType,
				_to,
				_value,
				keccak256(_data),
				_nonce,
				_salt,
				_gasToken,
				_gasPrice
			)).toEthSignedMessageHash();

		require(m_persistent[executionID] == bytes32(0), 'transaction-replay');
		m_persistent[executionID] = bytes32(0xa50daf8ffad995556f094fb7bb26ec5c7aadc7f574c741d0237ea13300bc1dd7);

		address lastSigner = address(0);
		for (uint256 i = 0; i < _sigs.length; ++i)
		{
			address signer  = executionID.recover(_sigs[i]);
			require(signer > lastSigner, "invalid-signatures-ordering");
			require(keyHasPurpose(addrToKey(signer), neededPurpose), "invalid-signature");
			lastSigner = signer;
		}

		this.execute(_operationType, _to, _value, _data);

		refund(gasBefore.sub(gasleft()), _gasPrice, _gasToken);
	}

	function refund(uint256 _gasUsed, uint256 _gasPrice, address _gasToken)
	internal
	{
		if (_gasToken == address(0))
		{
			msg.sender.transfer(_gasUsed.mul(_gasPrice));
		}
		else
		{
			IERC20(_gasToken).transfer(msg.sender, _gasUsed.mul(_gasPrice));
		}
	}

}
