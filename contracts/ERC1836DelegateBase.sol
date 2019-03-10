pragma solidity ^0.5.5;

import "./ERC1836.sol";

contract ERC1836DelegateBase is ERC1836
{
	function delegate()
	external view returns (address)
	{
		return m_delegate;
	}

	// params may vary
	// must be initialization
	// function initialize(...) external initialization;

	// must cleanup state before calling setDelegate
	// must be protected
	function updateDelegate(address,bytes calldata) external /*protected*/;
}