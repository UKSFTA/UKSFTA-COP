/*
 * UKSFTA_COP - fn_OpenLayerSelectGUI.sqf
 * Opens the layer selection dialog and populates it with data from the extension
 * 
 * Execution: Client (curator)
 * Called by: ImportDrawingsInit via remoteExec, or Refresh button
 *
 * Parameters:
 *   _firstOpen - Boolean - (Optional) true if this is the first open, false if refresh
 */

params [["_firstOpen", false]];

if (!hasInterface) exitWith {};

// If refreshing, close existing dialog first
if (!_firstOpen) then {
	// Dialog is already open, we just need to refresh the list
} else {
	// Open the dialog
	private _dialogCreated = createDialog "UKSFTA_COPLayerSelectDialog";
	if (!_dialogCreated) exitWith {
		systemChat "[UKSFTA_COP] Failed to create layer selection dialog";
	};
};

// Store reference to dialog
private _display = findDisplay 143501;
if (isNull _display) exitWith {
	systemChat "[UKSFTA_COP] Dialog not found";
};

// Set status to loading
private _statusCtrl = _display displayCtrl 1501;
_statusCtrl ctrlSetStructuredText parseText "<t color='#ffff00'>Loading maps and layers from database...</t>";

// First, request available maps from server
// The server calls extension and stores result, then we read it
private _uid = getPlayerUID player;

// Request map list from server
missionNamespace setVariable [format ["UKSFTA_COP_MapsReady_%1", _uid], false];
[_uid] remoteExec ["UKSFTA_COP_fnc_RequestMaps", 2];

// Wait for maps data
[] spawn {
	private _uid = getPlayerUID player;
	private _display = findDisplay 143501;
	if (isNull _display) exitWith {};

	// Wait for server response
	private _timeout = diag_tickTime + 10;
	waitUntil {
		sleep 0.1;
		(missionNamespace getVariable [format ["UKSFTA_COP_MapsReady_%1", _uid], false]) 
		|| (diag_tickTime > _timeout)
		|| (isNull findDisplay 143501)
	};

	if (isNull findDisplay 143501) exitWith {};
	_display = findDisplay 143501;

	if !(missionNamespace getVariable [format ["UKSFTA_COP_MapsReady_%1", _uid], false]) exitWith {
		private _statusCtrl = _display displayCtrl 1501;
		_statusCtrl ctrlSetStructuredText parseText "<t color='#ff0000'>Timeout: Could not reach server</t>";
	};

	// Get the maps data
	private _mapsData = missionNamespace getVariable [format ["UKSFTA_COP_MapsData_%1", _uid], []];

	// Populate map dropdown
	private _mapCombo = _display displayCtrl 1510;
	lbClear _mapCombo;

	{
		_x params ["_mapId", "_mapName", "_resolution", "_mapWidth", "_mapHeight"];
		private _idx = _mapCombo lbAdd format ["%1 (%2m/px, %3x%4)", _mapName, _resolution, _mapWidth, _mapHeight];
		_mapCombo lbSetData [_idx, str _mapId];
	} forEach _mapsData;

	if (count _mapsData > 0) then {
		_mapCombo lbSetCurSel 0;

		// Store selected map info in uiNamespace for later use
		(_mapsData select 0) params ["_mapId", "_mapName", "_resolution", "_mapWidth", "_mapHeight"];
		uiNamespace setVariable ["UKSFTA_COP_SelectedMapId", _mapId];
		uiNamespace setVariable ["UKSFTA_COP_SelectedMapResolution", _resolution];
		uiNamespace setVariable ["UKSFTA_COP_SelectedMapWidth", _mapWidth];
		uiNamespace setVariable ["UKSFTA_COP_SelectedMapHeight", _mapHeight];

		// Add selection changed handler
		_mapCombo ctrlAddEventHandler ["LBSelChanged", {
			params ["_ctrl", "_index"];
			private _mapIdStr = _ctrl lbData _index;
			private _mapId = parseNumber _mapIdStr;

			// Find map data
			private _mapsData = missionNamespace getVariable [format ["UKSFTA_COP_MapsData_%1", getPlayerUID player], []];
			{
				_x params ["_mId", "_mName", "_mRes", "_mW", "_mH"];
				if (_mId == _mapId) exitWith {
					uiNamespace setVariable ["UKSFTA_COP_SelectedMapId", _mId];
					uiNamespace setVariable ["UKSFTA_COP_SelectedMapResolution", _mRes];
					uiNamespace setVariable ["UKSFTA_COP_SelectedMapWidth", _mW];
					uiNamespace setVariable ["UKSFTA_COP_SelectedMapHeight", _mH];

					// Refresh layers for new map
					[_mId] call UKSFTA_COP_fnc_RefreshLayerList;
				};
			} forEach _mapsData;
		}];

		// Load layers for first map
		[_mapId] call UKSFTA_COP_fnc_RefreshLayerList;
	} else {
		private _statusCtrl = _display displayCtrl 1501;
		_statusCtrl ctrlSetStructuredText parseText "<t color='#ff8800'>No maps found in database</t>";
	};
};

// Define the refresh layer list function in missionNamespace
UKSFTA_COP_fnc_RefreshLayerList = {
	params ["_mapId"];

	private _display = findDisplay 143501;
	if (isNull _display) exitWith {};

	private _statusCtrl = _display displayCtrl 1501;
	_statusCtrl ctrlSetStructuredText parseText "<t color='#ffff00'>Loading layers...</t>";

	private _uid = getPlayerUID player;

	// Request layers from server
	missionNamespace setVariable [format ["UKSFTA_COP_LayersReady_%1", _uid], false];
	[_mapId, _uid] remoteExec ["UKSFTA_COP_fnc_RequestLayers", 2];

	// Wait and populate in spawned context
	[_mapId, _uid] spawn {
		params ["_mapId", "_uid"];

		private _timeout = diag_tickTime + 10;
		waitUntil {
			sleep 0.1;
			(missionNamespace getVariable [format ["UKSFTA_COP_LayersReady_%1", _uid], false])
			|| (diag_tickTime > _timeout)
			|| (isNull findDisplay 143501)
		};

		if (isNull findDisplay 143501) exitWith {};
		private _display = findDisplay 143501;

		if !(missionNamespace getVariable [format ["UKSFTA_COP_LayersReady_%1", _uid], false]) exitWith {
			private _statusCtrl = _display displayCtrl 1501;
			_statusCtrl ctrlSetStructuredText parseText "<t color='#ff0000'>Timeout loading layers</t>";
		};

		private _layersData = missionNamespace getVariable [format ["UKSFTA_COP_LayersData_%1", _uid], []];
		private _listBox = _display displayCtrl 1500;
		lbClear _listBox;

		// Store layer data for import
		uiNamespace setVariable ["UKSFTA_COP_LayersList", _layersData];

		{
			_x params ["_layerName", "_drawingCount", "_typeBreakdown"];
			private _displayText = format ["%1    |    %2 drawings    |    %3", _layerName, _drawingCount, _typeBreakdown];
			private _idx = _listBox lbAdd _displayText;
			_listBox lbSetData [_idx, _layerName];
		} forEach _layersData;

		private _statusCtrl = _display displayCtrl 1501;
		if (count _layersData > 0) then {
			_statusCtrl ctrlSetStructuredText parseText format ["<t color='#00ff00'>Found %1 layers with drawings</t>", count _layersData];
			_listBox lbSetCurSel 0;
		} else {
			_statusCtrl ctrlSetStructuredText parseText "<t color='#ff8800'>No layers with drawings found for this map</t>";
		};
	};
};

true
