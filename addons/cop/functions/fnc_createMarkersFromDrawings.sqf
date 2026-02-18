/*
 * UKSFTA_COP - fn_CreateMarkersFromDrawings.sqf
 * Creates Arma 3 map markers from website drawing data
 *
 * Coordinate conversion:
 *   Website uses pixel coords (origin top-left): (pixelX, pixelY)
 *   Arma 3 uses meters (origin bottom-left):
 *     worldX = pixelX * resolution
 *     worldY = (mapHeight - pixelY) * resolution
 *
 * Drawing types handled:
 *   - "symbol" -> ICON marker (NATO symbol or generic marker)
 *   - "arrow"  -> POLYLINE marker (line from start to end)
 *   - "zone"   -> POLYLINE marker (closed polygon outline)
 *   - "text"   -> ICON marker with text label
 *
 * Execution: Client (creates global markers visible to all)
 *
 * Parameters:
 *   _drawings   - Array  - Array of drawing data from extension
 *   _resolution - Number - Map resolution in meters per pixel
 *   _mapWidth   - Number - Map width in pixels
 *   _mapHeight  - Number - Map height in pixels
 *   _layerName  - String - Layer name (used for marker naming)
 *
 * Returns:
 *   Number - Count of markers created
 *
 * Drawing data format from extension (per drawing):
 *   [drawingType, dataJson, styleJson]
 *   drawingType: "arrow", "symbol", "zone", "text"
 *   dataJson: parsed data fields as sub-array
 *   styleJson: parsed style fields as sub-array
 */

params ["_drawings", "_resolution", "_mapWidth", "_mapHeight", "_layerName"];

// ============================================================
// Internal helper functions (must be defined BEFORE use)
// ============================================================

// --- Convert pixel coords to world coords ---
private _fnc_pixelToWorld = {
	params ["_pixelX", "_pixelY", "_res", "_mW", "_mH"];
	private _worldX = _pixelX * _res;
	private _worldY = (_mH - _pixelY) * _res;
	[_worldX, _worldY, 0]
};

// --- Determine marker color from symbol affiliation ---
// Enemy = Red, Friendly = Blue, Neutral = Green, Unknown = Yellow
private _fnc_affiliationColor = {
	params [["_symbolPath", ""]];
	private _lower = toLower _symbolPath;
	if ((_lower find "enemy" >= 0) || (_lower find "hostile" >= 0) || (_lower find "opfor" >= 0)) exitWith {
		"ColorRed"
	};
	if ((_lower find "friendly" >= 0) || (_lower find "blufor" >= 0) || (_lower find "allied" >= 0)) exitWith {
		"colorBLUFOR"
	};
	if ((_lower find "neutral" >= 0) || (_lower find "independent" >= 0) || (_lower find "indfor" >= 0)) exitWith {
		"colorIndependent"
	};
	if ((_lower find "unknown" >= 0) || (_lower find "civilian" >= 0)) exitWith {
		"ColorYellow"
	};
	// Default fallback
	"colorBLUFOR"
};

// --- Create SYMBOL marker (NATO icon) ---
private _fnc_createSymbolMarker = {
	params ["_name", "_data", "_style", "_res", "_mW", "_mH"];
	
	// Data fields: [posX, posY, symbolPath, size, unitSize, designation, parent]
	_data params [
		["_posX", 0],
		["_posY", 0],
		["_symbolPath", ""],
		["_size", 48],
		["_unitSize", ""],
		["_designation", ""],
		["_parent", ""]
	];

	private _worldPos = [_posX, _posY, _res, _mW, _mH] call _fnc_pixelToWorld;
	private _markerType = [_symbolPath] call UKSFTA_COP_fnc_MapSymbolToMarkerType;

	// Determine color from symbol affiliation (parsed from filename)
	private _markerColor = [_symbolPath] call _fnc_affiliationColor;

	// Build display text
	private _displayText = "";
	if (_designation != "") then {
		_displayText = _designation;
	};
	if (_parent != "" && _designation != "") then {
		_displayText = format ["%1 (%2)", _designation, _parent];
	};
	if (_parent != "" && _designation == "") then {
		_displayText = _parent;
	};

	// Create the marker globally so all players can see it
	private _mk = createMarker [_name, _worldPos];
	if (_mk == "") exitWith { [] };

	_mk setMarkerShapeLocal "ICON";
	_mk setMarkerTypeLocal _markerType;
	_mk setMarkerColorLocal _markerColor;
	_mk setMarkerSizeLocal [0.8, 0.8];
	_mk setMarkerText _displayText;

	[_name]
};

// --- Create ARROW marker (polyline from start to end + polyline arrowhead) ---
private _fnc_createArrowMarker = {
	params ["_name", "_data", "_style", "_res", "_mW", "_mH"];

	// Data fields: [startX, startY, endX, endY]
	_data params [
		["_startX", 0],
		["_startY", 0],
		["_endX", 0],
		["_endY", 0]
	];

	private _worldStart = [_startX, _startY, _res, _mW, _mH] call _fnc_pixelToWorld;
	private _worldEnd = [_endX, _endY, _res, _mW, _mH] call _fnc_pixelToWorld;

	// Get style
	_style params [
		["_color", "#ff0000"],
		["_width", 2]
	];

	private _markerColor = [_color] call UKSFTA_COP_fnc_HexToMarkerColor;

	// Collect all marker names created by this function
	private _createdMarkers = [];

	// Create polyline marker for the arrow shaft (global)
	private _mk = createMarker [_name, [0, 0, 0]];
	if (_mk == "") exitWith { [] };

	_mk setMarkerShapeLocal "POLYLINE";
	_mk setMarkerColorLocal _markerColor;
	_mk setMarkerPolyline [
		_worldStart select 0, _worldStart select 1,
		_worldEnd select 0, _worldEnd select 1
	];
	_createdMarkers pushBack _name;

	// Create arrowhead as two polyline segments forming a V at the tip
	private _dx = (_worldEnd select 0) - (_worldStart select 0);
	private _dy = (_worldEnd select 1) - (_worldStart select 1);
	private _len = sqrt (_dx * _dx + _dy * _dy);

	if (_len > 0) then {
		// Normalize direction vector
		private _ndx = _dx / _len;
		private _ndy = _dy / _len;

		// Arrowhead wing length: proportional to line but capped
		private _wingLen = (_len * 0.12) min 150 max 30;

		// Arrowhead half-angle ~25 degrees
		private _cosA = 0.906; // cos(25°)
		private _sinA = 0.423; // sin(25°)

		// Wing direction vectors (rotated backward from -direction by ±25°)
		// Left wing
		private _lwx = (-_ndx * _cosA) - (-_ndy * _sinA);
		private _lwy = (-_ndx * _sinA) + (-_ndy * _cosA);
		// Right wing
		private _rwx = (-_ndx * _cosA) - (-_ndy * (-_sinA));
		private _rwy = (-_ndx * (-_sinA)) + (-_ndy * _cosA);

		private _tipX = _worldEnd select 0;
		private _tipY = _worldEnd select 1;

		private _leftX = _tipX + _lwx * _wingLen;
		private _leftY = _tipY + _lwy * _wingLen;
		private _rightX = _tipX + _rwx * _wingLen;
		private _rightY = _tipY + _rwy * _wingLen;

		// Left wing polyline
		private _headNameL = _name + "_headL";
		private _mkHL = createMarker [_headNameL, [0, 0, 0]];
		if (_mkHL != "") then {
			_mkHL setMarkerShapeLocal "POLYLINE";
			_mkHL setMarkerColorLocal _markerColor;
			_mkHL setMarkerPolyline [_leftX, _leftY, _tipX, _tipY];
			_createdMarkers pushBack _headNameL;
		};

		// Right wing polyline
		private _headNameR = _name + "_headR";
		private _mkHR = createMarker [_headNameR, [0, 0, 0]];
		if (_mkHR != "") then {
			_mkHR setMarkerShapeLocal "POLYLINE";
			_mkHR setMarkerColorLocal _markerColor;
			_mkHR setMarkerPolyline [_rightX, _rightY, _tipX, _tipY];
			_createdMarkers pushBack _headNameR;
		};
	};

	_createdMarkers
};

// --- Create ZONE marker (closed polygon as polyline + line-based fill) ---
private _fnc_createZoneMarker = {
	params ["_name", "_data", "_style", "_res", "_mW", "_mH"];

	// Data fields: [nodesArray] where nodesArray is [[x1,y1],[x2,y2],...]
	_data params [["_nodes", []]];

	if (count _nodes < 3) exitWith {
		diag_log format ["[UKSFTA_COP] Zone %1 has fewer than 3 nodes, skipping", _name];
		[]
	};

	// Convert all nodes to world coordinates
	private _worldNodes = [];
	{
		_x params ["_px", "_py"];
		private _worldPos = [_px, _py, _res, _mW, _mH] call _fnc_pixelToWorld;
		_worldNodes pushBack [_worldPos select 0, _worldPos select 1];
	} forEach _nodes;

	// Build polyline coordinates (flat array, close the polygon)
	private _polyline = [];
	{ _polyline pushBack (_x select 0); _polyline pushBack (_x select 1); } forEach _worldNodes;
	// Close polygon
	_polyline pushBack ((_worldNodes select 0) select 0);
	_polyline pushBack ((_worldNodes select 0) select 1);

	// Get style: [color, width/size, fillColor, fillOpacity, fillType]
	_style params [
		["_color", "#ff0000"],
		["_width", 2],
		["_fillColor", ""],
		["_fillOpacity", 0.3],
		["_fillType", "diagonal"]
	];

	private _markerColor = [_color] call UKSFTA_COP_fnc_HexToMarkerColor;

	// Collect all marker names created by this function
	private _createdMarkers = [];

	// Create polyline marker for the zone outline (global)
	private _mk = createMarker [_name, [0, 0, 0]];
	if (_mk == "") exitWith { [] };

	_mk setMarkerShapeLocal "POLYLINE";
	_mk setMarkerColorLocal _markerColor;
	_mk setMarkerPolyline _polyline;
	_createdMarkers pushBack _name;

	// ===== Line-based polygon fill =====
	// Instead of an ELLIPSE approximation, we generate parallel lines clipped to
	// the polygon boundary using a scanline intersection algorithm.
	if (_fillOpacity > 0) then {
		// Resolve fill color: use fillColor if set, otherwise the outline color
		private _actualFillColor = [_color, _fillColor] select (_fillColor != "");
		private _fillMarkerColor = [_actualFillColor] call UKSFTA_COP_fnc_HexToMarkerColor;

		// Close worldNodes ring for edge iteration
		private _closedNodes = +_worldNodes;
		_closedNodes pushBack (_worldNodes select 0);

		// Bounding box in world coords
		private _minX = 1e10; private _maxX = -1e10;
		private _minY = 1e10; private _maxY = -1e10;
		{
			_minX = _minX min (_x select 0);
			_maxX = _maxX max (_x select 0);
			_minY = _minY min (_x select 1);
			_maxY = _maxY max (_x select 1);
		} forEach _worldNodes;

		private _bboxW = _maxX - _minX;
		private _bboxH = _maxY - _minY;
		private _bboxSize = _bboxW max _bboxH;

		// Spacing: ~15 lines across the zone, minimum 50m
		private _spacing = (_bboxSize / 15) max 50;
		// For "solid" fill, use much tighter spacing to approximate a solid fill
		if (toLower _fillType == "solid") then {
			_spacing = (_bboxSize / 40) max 20;
		};

		// Determine sweep directions based on fillType
		// Each entry: [normalX, normalY, lineDirX, lineDirY]
		// Normal = direction we sweep across; lineDir = direction of each fill line
		private _sweeps = [];
		switch (toLower _fillType) do {
			case "horizontal":  { _sweeps = [[0, 1, 1, 0]]; };
			case "vertical":    { _sweeps = [[1, 0, 0, 1]]; };
			case "crosshatch":  { _sweeps = [[0, 1, 1, 0], [1, 0, 0, 1]]; };
			default             { _sweeps = [[1, 1, 1, -1]]; }; // diagonal (also used for "solid" and default)
		};

		private _fillIdx = 0;

		{
			private _nx = _x select 0;
			private _ny = _x select 1;
			private _ldx = _x select 2;
			private _ldy = _x select 3;

			// Calculate range of dot products (N dot P) across all vertices
			private _minD = 1e10;
			private _maxD = -1e10;
			{
				private _d = (_x select 0) * _nx + (_x select 1) * _ny;
				_minD = _minD min _d;
				_maxD = _maxD max _d;
			} forEach _worldNodes;

			// For diagonal normals, spacing needs adjustment by sqrt(2)
			private _effSpacing = _spacing;
			if (_nx != 0 && _ny != 0) then { _effSpacing = _spacing * 1.414; };

			// Sweep across the polygon generating fill lines
			private _d = _minD + _effSpacing;
			while {_d < _maxD} do {
				// Find all intersections of sweep line (N.P = d) with polygon edges
				private _intersections = [];

				for "_i" from 0 to (count _closedNodes - 2) do {
					private _a = _closedNodes select _i;
					private _b = _closedNodes select (_i + 1);

					private _ax = _a select 0; private _ay = _a select 1;
					private _bx = _b select 0; private _by = _b select 1;

					private _dA = _ax * _nx + _ay * _ny;
					private _dB = _bx * _nx + _by * _ny;

					private _denom = _dB - _dA;
					if (abs _denom > 0.001) then {
						private _t = (_d - _dA) / _denom;
						if (_t >= 0 && {_t <= 1}) then {
							private _ix = _ax + _t * (_bx - _ax);
							private _iy = _ay + _t * (_by - _ay);
							// Sort key: projection onto line direction
							private _proj = _ix * _ldx + _iy * _ldy;
							_intersections pushBack [_proj, _ix, _iy];
						};
					};
				};

				// Sort intersections by projection along line direction
				_intersections sort true;

				// Pair up intersections (enter/exit) and create line segments
				for "_j" from 0 to (count _intersections - 2) step 2 do {
					if (_j + 1 < count _intersections) then {
						private _p1 = _intersections select _j;
						private _p2 = _intersections select (_j + 1);

						private _fillLineName = format ["%1_hatch_%2", _name, _fillIdx];
						_fillIdx = _fillIdx + 1;

						private _mkLine = createMarker [_fillLineName, [0, 0, 0]];
						if (_mkLine != "") then {
							_mkLine setMarkerShapeLocal "POLYLINE";
							_mkLine setMarkerColorLocal _fillMarkerColor;
							_mkLine setMarkerAlphaLocal _fillOpacity;
							_mkLine setMarkerPolyline [
								_p1 select 1, _p1 select 2,
								_p2 select 1, _p2 select 2
							];
							_createdMarkers pushBack _fillLineName;
						};
					};
				};

				_d = _d + _effSpacing;
			};
		} forEach _sweeps;

		diag_log format ["[UKSFTA_COP] Created %1 fill lines for zone '%2' (type: %3)", count _createdMarkers - 1, _name, _fillType];
	};

	_createdMarkers
};

// --- Create TEXT marker (icon with text label) ---
private _fnc_createTextMarker = {
	params ["_name", "_data", "_style", "_res", "_mW", "_mH"];

	// Data fields: [posX, posY, textContent]
	_data params [
		["_posX", 0],
		["_posY", 0],
		["_textContent", ""]
	];

	if (_textContent == "") exitWith { [] };

	private _worldPos = [_posX, _posY, _res, _mW, _mH] call _fnc_pixelToWorld;

	// Get style: [color, size, fillColor, fillOpacity]
	_style params [
		["_color", "#ffffff"],
		["_fontSize", 14]
	];

	private _markerColor = [_color] call UKSFTA_COP_fnc_HexToMarkerColor;

	private _mk = createMarker [_name, _worldPos];
	if (_mk == "") exitWith { [] };

	_mk setMarkerShapeLocal "ICON";
	_mk setMarkerTypeLocal "hd_dot"; // Invisible dot marker, only text is shown
	_mk setMarkerColorLocal _markerColor;
	_mk setMarkerSizeLocal [0, 0]; // Zero size hides the dot, text still renders
	_mk setMarkerText _textContent;

	diag_log format ["[UKSFTA_COP] Created text marker '%1' at %2 with text '%3'", _name, _worldPos, _textContent];

	[_name]
};

// ============================================================
// Main processing loop (helpers are all defined above)
// ============================================================

// Initialize or get the array tracking all imported markers
private _existingMarkers = missionNamespace getVariable ["UKSFTA_COP_ImportedMarkers", []];

// Generation counter ensures unique marker names across re-imports
// This prevents createMarker from silently failing when re-using a name
// that was previously deleteMarker'd in the same session.
private _gen = missionNamespace getVariable ["UKSFTA_COP_MarkerGeneration", 0];
_gen = _gen + 1;
missionNamespace setVariable ["UKSFTA_COP_MarkerGeneration", _gen, true];

private _markerCount = 0;
private _markerPrefix = format ["C9M_g%1_%2", _gen, _layerName];

// Process each drawing
{
	_x params ["_drawingType", "_data", "_style"];

	private _markerName = format ["%1_%2", _markerPrefix, _forEachIndex];
	private _createdNames = [];

	switch (toLower _drawingType) do {
		case "symbol": {
			_createdNames = [_markerName, _data, _style, _resolution, _mapWidth, _mapHeight] call _fnc_createSymbolMarker;
		};
		case "arrow": {
			_createdNames = [_markerName, _data, _style, _resolution, _mapWidth, _mapHeight] call _fnc_createArrowMarker;
		};
		case "zone": {
			_createdNames = [_markerName, _data, _style, _resolution, _mapWidth, _mapHeight] call _fnc_createZoneMarker;
		};
		case "text": {
			_createdNames = [_markerName, _data, _style, _resolution, _mapWidth, _mapHeight] call _fnc_createTextMarker;
		};
		default {
			diag_log format ["[UKSFTA_COP] Unknown drawing type: %1", _drawingType];
		};
	};

	if (_createdNames isNotEqualTo []) then {
		_existingMarkers append _createdNames;
		_markerCount = _markerCount + 1;
	};
} forEach _drawings;

// Store all imported marker names (including sub-markers) for later cleanup
missionNamespace setVariable ["UKSFTA_COP_ImportedMarkers", _existingMarkers, true];

diag_log format ["[UKSFTA_COP] Created %1 drawings (%2 total markers) for layer '%3'", _markerCount, count _existingMarkers, _layerName];

_markerCount
