/*
 * UKSFTA_COP - fn_RequestMaps.sqf
 * Server-side: Fetch available maps from the database via extension
 * Results are stored in missionNamespace and publicVariable'd to requesting client
 *
 * Execution: Server only
 * Called by: Client via remoteExec
 *
 * Parameters:
 *   _playerUid - String - Requesting player's UID
 */

if (!isServer) exitWith {};

params ["_playerUid"];

diag_log format ["[UKSFTA_COP] RequestMaps for player %1", _playerUid];

private _result = "uksfta_cop_ext" callExtension "getmaps";
diag_log format ["[UKSFTA_COP] getmaps result: %1", _result];

private _mapsData = [];

if (_result != "" && {_result select [0, 5] != "Error"}) then {
	// Parse the SQF array returned by extension
	// Format: [[id,"name",resolution,width,height],...]
	try {
		_mapsData = parseSimpleArray _result;
	} catch {
		diag_log format ["[UKSFTA_COP] ERROR parsing maps data: %1", _exception];
		_mapsData = [];
	};
};

// Store and broadcast to requesting client
private _varName = format ["UKSFTA_COP_MapsData_%1", _playerUid];
missionNamespace setVariable [_varName, _mapsData];
publicVariable _varName;

private _readyVar = format ["UKSFTA_COP_MapsReady_%1", _playerUid];
missionNamespace setVariable [_readyVar, true];
publicVariable _readyVar;

diag_log format ["[UKSFTA_COP] Sent %1 maps to player %2", count _mapsData, _playerUid];

true
