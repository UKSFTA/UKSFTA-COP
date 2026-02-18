/*
 * UKSFTA_COP - fn_RequestLayers.sqf
 * Server-side: Fetch available layers for a map from the database via extension
 * Returns layer names with drawing counts and type breakdowns
 *
 * Execution: Server only
 * Called by: Client via remoteExec
 *
 * Parameters:
 *   _mapId     - Number - Map ID to query layers for
 *   _playerUid - String - Requesting player's UID
 */

if (!isServer) exitWith {};

params ["_mapId", "_playerUid"];

diag_log format ["[UKSFTA_COP] RequestLayers for map %1, player %2", _mapId, _playerUid];

private _command = format ["getlayers|%1", _mapId];
private _result = "uksfta_cop_ext" callExtension _command;
diag_log format ["[UKSFTA_COP] getlayers result: %1", _result];

private _layersData = [];

if (_result != "" && {_result select [0, 5] != "Error"}) then {
	// Parse the SQF array returned by extension
	// Format: [["layerName",count,"types_breakdown"],...]
	try {
		_layersData = parseSimpleArray _result;
	} catch {
		diag_log format ["[UKSFTA_COP] ERROR parsing layers data: %1", _exception];
		_layersData = [];
	};
};

// Store and broadcast to requesting client
private _varName = format ["UKSFTA_COP_LayersData_%1", _playerUid];
missionNamespace setVariable [_varName, _layersData];
publicVariable _varName;

private _readyVar = format ["UKSFTA_COP_LayersReady_%1", _playerUid];
missionNamespace setVariable [_readyVar, true];
publicVariable _readyVar;

diag_log format ["[UKSFTA_COP] Sent %1 layers to player %2", count _layersData, _playerUid];

true
