#include "\z\uksfta\addons\cop\script_macros.hpp"
/*
 * UKSFTA-COP - fn_createMarkersFromJSON.sqf
 * Processes simplified feature array and creates markers
 *
 * Parameters:
 *   _features - Array - [ [type, coords, properties_array], ... ]
 */

params [["_features", []]];

if (_features isEqualTo []) exitWith { 0 };

private _markerCount = 0;
private _existingMarkers = missionNamespace getVariable ["UKSFTA_COP_importedMarkers", []];

{ deleteMarker _x; } forEach _existingMarkers;
_existingMarkers = [];

{
    _x params ["_type", "_coords", "_propsArray"];
    
    private _props = createHashMapFromArray _propsArray;
    private _markerName = format ["uksfta_cop_%1_%2", floor(time), _forEachIndex];
    
    private _colorHex = _props getOrDefault ["color", "#ffffff"];
    private _markerColor = [_colorHex] call UKSFTA_COP_fnc_hexToMarkerColor;
    
    switch (toLower _type) do {
        case "point": {
            private _pos = [_coords select 0, _coords select 1, 0];
            private _mk = createMarker [_markerName, _pos];
            _mk setMarkerShapeLocal "ICON";
            
            private _symbol = _props getOrDefault ["symbol", "hd_dot"];
            private _markerType = [_symbol] call UKSFTA_COP_fnc_mapSymbolToMarkerType;
            
            _mk setMarkerTypeLocal _markerType;
            _mk setMarkerColorLocal _markerColor;
            _mk setMarkerText (_props getOrDefault ["text", ""]);
            _existingMarkers pushBack _markerName;
            _markerCount = _markerCount + 1;
        };
        case "linestring": {
            private _mk = createMarker [_markerName, [0,0,0]];
            _mk setMarkerShapeLocal "POLYLINE";
            _mk setMarkerColorLocal _markerColor;
            
            private _polyline = [];
            { _polyline append [_x select 0, _x select 1]; } forEach _coords;
            _mk setMarkerPolyline _polyline;
            
            _existingMarkers pushBack _markerName;
            _markerCount = _markerCount + 1;
        };
        case "polygon": {
            private _ring = _coords select 0;
            private _mk = createMarker [_markerName, [0,0,0]];
            _mk setMarkerShapeLocal "POLYLINE";
            _mk setMarkerColorLocal _markerColor;
            
            private _polyline = [];
            { _polyline append [_x select 0, _x select 1]; } forEach _ring;
            _polyline append [(_ring select 0) select 0, (_ring select 0) select 1];
            _mk setMarkerPolyline _polyline;
            
            _existingMarkers pushBack _markerName;
            _markerCount = _markerCount + 1;
        };
    };
} forEach _features;

missionNamespace setVariable ["UKSFTA_COP_importedMarkers", _existingMarkers];
_markerCount;
