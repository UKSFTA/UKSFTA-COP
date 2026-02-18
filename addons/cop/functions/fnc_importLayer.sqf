/*
 * UKSFTA_COP - fn_ImportLayer.sqf
 * Client-side: Called when Zeus clicks "Import Selected Layer"
 * Requests drawings from server, then calls CreateMarkersFromDrawings
 *
 * Execution: Client (curator)
 * Called by: GUI Import button
 */

if (!hasInterface) exitWith {};

private _display = findDisplay 143501;
if (isNull _display) exitWith {
	systemChat "[UKSFTA_COP] Dialog not found";
};

private _listBox = _display displayCtrl 1500;
private _selectedIndex = lbCurSel _listBox;

if (_selectedIndex < 0) exitWith {
	systemChat "[UKSFTA_COP] No layer selected";
};

private _layerName = _listBox lbData _selectedIndex;
private _mapId = uiNamespace getVariable ["UKSFTA_COP_SelectedMapId", -1];
private _resolution = uiNamespace getVariable ["UKSFTA_COP_SelectedMapResolution", 20];
private _mapWidth = uiNamespace getVariable ["UKSFTA_COP_SelectedMapWidth", 0];
private _mapHeight = uiNamespace getVariable ["UKSFTA_COP_SelectedMapHeight", 0];

if (_mapId < 0) exitWith {
	systemChat "[UKSFTA_COP] No map selected";
};

// Update status
private _statusCtrl = _display displayCtrl 1501;
_statusCtrl ctrlSetStructuredText parseText format ["<t color='#ffff00'>Importing layer '%1'...</t>", _layerName];

private _uid = getPlayerUID player;

// Request drawings from server
missionNamespace setVariable [format ["UKSFTA_COP_DrawingsReady_%1", _uid], false];
[_mapId, _layerName, _uid] remoteExec ["UKSFTA_COP_fnc_RequestDrawings", 2];

// Wait for response in spawned context
[_layerName, _mapId, _resolution, _mapWidth, _mapHeight, _uid] spawn {
	params ["_layerName", "_mapId", "_resolution", "_mapWidth", "_mapHeight", "_uid"];

	private _timeout = diag_tickTime + 30; // 30s timeout for large imports
	waitUntil {
		sleep 0.1;
		(missionNamespace getVariable [format ["UKSFTA_COP_DrawingsReady_%1", _uid], false])
		|| (diag_tickTime > _timeout)
		|| (isNull findDisplay 143501)
	};

	if (isNull findDisplay 143501) exitWith {};
	private _display = findDisplay 143501;

	if !(missionNamespace getVariable [format ["UKSFTA_COP_DrawingsReady_%1", _uid], false]) exitWith {
		private _statusCtrl = _display displayCtrl 1501;
		_statusCtrl ctrlSetStructuredText parseText "<t color='#ff0000'>Timeout fetching drawings from server</t>";
	};

	private _drawings = missionNamespace getVariable [format ["UKSFTA_COP_DrawingsData_%1", _uid], []];
	private _mapInfo = missionNamespace getVariable [format ["UKSFTA_COP_MapInfo_%1", _uid], [_mapId, "", _resolution, _mapWidth, _mapHeight]];

	if (count _drawings == 0) exitWith {
		private _statusCtrl = _display displayCtrl 1501;
		_statusCtrl ctrlSetStructuredText parseText "<t color='#ff8800'>No drawings found in this layer</t>";
	};

	// Get map info for coordinate conversion
	_mapInfo params [
		["_mId", _mapId],
		["_mName", ""],
		["_mResolution", _resolution],
		["_mWidth", _mapWidth],
		["_mHeight", _mapHeight]
	];

	// Create markers from the drawings
	private _markerCount = [_drawings, _mResolution, _mWidth, _mHeight, _layerName] call UKSFTA_COP_fnc_CreateMarkersFromDrawings;

	// Update status
	private _statusCtrl = _display displayCtrl 1501;
	_statusCtrl ctrlSetStructuredText parseText format [
		"<t color='#00ff00'>Successfully imported %1 markers from layer '%2'</t>",
		_markerCount, _layerName
	];

	systemChat format ["[UKSFTA_COP] Imported %1 markers from layer '%2'", _markerCount, _layerName];
};

true
