/*
 * UKSFTA_COP - fn_RequestDrawings.sqf
 * Server-side: Fetch all drawings for a specific map + layer from the database
 * Results may be chunked due to callExtension output size limits (10KB)
 *
 * Execution: Server only
 * Called by: Client via remoteExec (from ImportLayer)
 *
 * Parameters:
 *   _mapId     - Number - Map ID
 *   _layerName - String - Layer name to fetch drawings for
 *   _playerUid - String - Requesting player's UID
 */

if (!isServer) exitWith {};

params ["_mapId", "_layerName", "_playerUid"];

diag_log format ["[UKSFTA_COP] RequestDrawings for map %1, layer '%2', player %3", _mapId, _layerName, _playerUid];

// First get the count to know how many chunks to expect
private _countCmd = format ["getdrawingcount|%1|%2", _mapId, _layerName];
private _countResult = "uksfta_cop_ext" callExtension _countCmd;

private _totalDrawings = 0;
if (_countResult select [0, 5] != "Error") then {
	_totalDrawings = parseNumber _countResult;
};

diag_log format ["[UKSFTA_COP] Total drawings for layer: %1", _totalDrawings];

// Fetch drawings in chunks (extension handles pagination)
// Each chunk returns a batch of drawings as SQF array
private _allDrawings = [];
private _offset = 0;
private _chunkSize = 20; // drawings per chunk to stay within callExtension limits

while {_offset < _totalDrawings} do {
	private _cmd = format ["getdrawings|%1|%2|%3|%4", _mapId, _layerName, _offset, _chunkSize];
	private _chunkResult = "uksfta_cop_ext" callExtension _cmd;
	
	if (_chunkResult select [0, 5] == "Error") exitWith {
		diag_log format ["[UKSFTA_COP] ERROR fetching chunk at offset %1: %2", _offset, _chunkResult];
	};

	if (_chunkResult == "[]" || _chunkResult == "") exitWith {};

	try {
		private _chunk = parseSimpleArray _chunkResult;
		_allDrawings append _chunk;
	} catch {
		diag_log format ["[UKSFTA_COP] ERROR parsing chunk at offset %1: %2", _offset, _exception];
	};

	_offset = _offset + _chunkSize;
};

diag_log format ["[UKSFTA_COP] Fetched %1 drawings total", count _allDrawings];

// Also get the map resolution info for coordinate conversion
private _mapInfoCmd = format ["getmapinfo|%1", _mapId];
private _mapInfoResult = "uksfta_cop_ext" callExtension _mapInfoCmd;

private _mapInfo = [];
if (_mapInfoResult select [0, 5] != "Error") then {
	try {
		_mapInfo = parseSimpleArray _mapInfoResult;
	} catch {
		diag_log format ["[UKSFTA_COP] ERROR parsing map info: %1", _exception];
	};
};

// Store and broadcast
private _drawingsVar = format ["UKSFTA_COP_DrawingsData_%1", _playerUid];
missionNamespace setVariable [_drawingsVar, _allDrawings];
publicVariable _drawingsVar;

private _mapInfoVar = format ["UKSFTA_COP_MapInfo_%1", _playerUid];
missionNamespace setVariable [_mapInfoVar, _mapInfo];
publicVariable _mapInfoVar;

private _readyVar = format ["UKSFTA_COP_DrawingsReady_%1", _playerUid];
missionNamespace setVariable [_readyVar, true];
publicVariable _readyVar;

true
