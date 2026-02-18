/*
 * UKSFTA_COP - fn_HexToMarkerColor.sqf
 * Converts a hex color string (e.g. "#ff0000") to the nearest Arma 3 marker color
 *
 * Arma 3 marker colors are limited to predefined classes in CfgMarkerColors.
 * This function finds the closest match by comparing RGB distances.
 *
 * Execution: Any
 *
 * Parameters:
 *   _hexColor - String - Hex color string with # prefix (e.g. "#ff0000")
 *
 * Returns:
 *   String - Arma 3 marker color class name (e.g. "ColorRed")
 */

params [["_hexColor", "#000000"]];

// Remove # prefix if present
if (_hexColor select [0, 1] == "#") then {
	_hexColor = _hexColor select [1];
};

// Ensure 6 characters
if (count _hexColor < 6) exitWith { "ColorBlack" };

// Parse hex to RGB (0-255)
private _fnc_hexToDec = {
	params ["_hexChar"];
	private _c = toLower _hexChar;
	switch (_c) do {
		case "a": { 10 };
		case "b": { 11 };
		case "c": { 12 };
		case "d": { 13 };
		case "e": { 14 };
		case "f": { 15 };
		default  { parseNumber _c };
	};
};

private _r = ([_hexColor select [0, 1]] call _fnc_hexToDec) * 16 + ([_hexColor select [1, 1]] call _fnc_hexToDec);
private _g = ([_hexColor select [2, 1]] call _fnc_hexToDec) * 16 + ([_hexColor select [3, 1]] call _fnc_hexToDec);
private _b = ([_hexColor select [4, 1]] call _fnc_hexToDec) * 16 + ([_hexColor select [5, 1]] call _fnc_hexToDec);

// Available Arma 3 marker colors with their RGB values (0-255)
// [className, [R, G, B]]
private _colors = [
	["ColorBlack",    [0,   0,   0  ]],
	["ColorGrey",     [128, 128, 128]],
	["ColorRed",      [230, 0,   0  ]],
	["ColorBrown",    [128, 64,  0  ]],
	["ColorOrange",   [217, 102, 0  ]],
	["ColorYellow",   [217, 217, 0  ]],
	["ColorKhaki",    [128, 153, 102]],
	["ColorGreen",    [0,   204, 0  ]],
	["ColorBlue",     [0,   0,   255]],
	["ColorPink",     [255, 76,  102]],
	["ColorWhite",    [255, 255, 255]],
	["colorBLUFOR",   [0,   76,  153]],
	["colorOPFOR",    [128, 0,   0  ]],
	["colorIndependent", [0, 128, 0 ]],
	["colorCivilian", [102, 0,   128]]
];

// Find closest color by Euclidean distance in RGB space
private _bestColor = "ColorBlack";
private _bestDist = 1e10;

{
	_x params ["_className", "_rgb"];
	_rgb params ["_cr", "_cg", "_cb"];

	private _dist = sqrt (
		((_r - _cr) ^ 2) +
		((_g - _cg) ^ 2) +
		((_b - _cb) ^ 2)
	);

	if (_dist < _bestDist) then {
		_bestDist = _dist;
		_bestColor = _className;
	};
} forEach _colors;

_bestColor
