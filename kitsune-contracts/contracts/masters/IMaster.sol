pragma solidity ^0.5.0;

import "../interfaces/IERC897.sol";


/**
 * @title IMaster
 * @dev Interface of the MasterBase. All masters should inherit from it.
 */
contract IMaster is IERC897
{
	/**
	 * @dev Returns weither of not an address is a controllers.
	 */
	function isController(address)
	external view returns (bool);

	/**
	 * @dev Returns the current initialization status.
	 */
	function isInitialized()
	external view returns (bool);

	/**
	 * @dev kitsune wallet's upgrade process with optional reset by the old master.
	 * @param logic new master to use
	 * @param data callback to initialize the proxy using the new master
	 * @param reset flag used to trigger the reset of the proxy by the old master
	 */
	function updateImplementation(address logic, bytes calldata data, bool reset)
	external;
}
