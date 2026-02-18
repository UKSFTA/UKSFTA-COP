/*
 * UKSFTA_COP - fn_ImportDrawingsInit.sqf
 * Called when Zeus places the Import Map Drawings module
 * Initializes the extension DB connection and opens the GUI
 *
 * Execution: Server (module function), then opens GUI on curator client
 *
 * Parameters:
 *   _logic  - Object - The module logic object
 *   _synced - Array  - Synchronized objects (unused)
 */

params ["_logic", "_synced"];

if (!isServer) exitWith {};

private _curatorOwner = objNull;

// Find which player is the curator who placed this module
{
	if (_x == getAssignedCuratorLogic player) exitWith {
		_curatorOwner = player;
	};
} forEach allCurators;

// If we can't find the curator from allCurators, try to get curator object from the logic
if (isNull _curatorOwner) then {
	{
		private _curator = getAssignedCuratorLogic _x;
		if (!isNull _curator) exitWith {
			_curatorOwner = _x;
		};
	} forEach allPlayers;
};

diag_log "[UKSFTA_COP] ImportDrawingsInit - Module placed, initializing extension...";

// Initialize the extension database connection (uses same pims_config.json)
private _initResult = "uksfta_cop_ext" callExtension "initdb";
diag_log format ["[UKSFTA_COP] Extension initdb result: %1", _initResult];

if (_initResult == "OK" || {_initResult == "Already initialized"}) then {
	diag_log "[UKSFTA_COP] Extension initialized successfully";

	// Open the GUI on all curator clients (the Zeus who placed the module)
	if (!isNull _curatorOwner) then {
		// Tell the specific curator client to open the GUI
		[true] remoteExec ["UKSFTA_COP_fnc_OpenLayerSelectGUI", _curatorOwner];
		diag_log format ["[UKSFTA_COP] Sent GUI open command to curator: %1", name _curatorOwner];
	} else {
		// Fallback: open on whoever has a curator interface open
		[true] remoteExec ["UKSFTA_COP_fnc_OpenLayerSelectGUI", 0];
		diag_log "[UKSFTA_COP] Warning: Could not identify specific curator, broadcasting GUI open";
	};
} else {
	// Extension init failed
	private _errorMsg = format ["[UKSFTA_COP] ERROR: Extension initialization failed: %1", _initResult];
	diag_log _errorMsg;

	if (!isNull _curatorOwner) then {
		[_errorMsg] remoteExec ["systemChat", _curatorOwner];
	} else {
		[_errorMsg] remoteExec ["systemChat", 0];
	};
};

// Clean up the module logic object
deleteVehicle _logic;

true
