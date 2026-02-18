/*
 * UKSFTA_COP - fn_DeleteImportedMarkers.sqf
 * Deletes all markers that were imported via UKSFTA_COP
 * This includes primary markers and all sub-markers (arrowheads, zone fill lines)
 *
 * Execution: Client (curator) - creates global deletions
 * Called by: GUI "Delete All Imported Markers" button
 */

private _markers = missionNamespace getVariable ["UKSFTA_COP_ImportedMarkers", []];

if (count _markers == 0) exitWith {
	systemChat "[UKSFTA_COP] No imported markers to delete";
};

private _count = count _markers;

{
	deleteMarker _x;
} forEach _markers;

missionNamespace setVariable ["UKSFTA_COP_ImportedMarkers", [], true];

systemChat format ["[UKSFTA_COP] Deleted %1 markers", _count];

// Update status if dialog is open
private _display = findDisplay 143501;
if (!isNull _display) then {
	private _statusCtrl = _display displayCtrl 1501;
	_statusCtrl ctrlSetStructuredText parseText format [
		"<t color='#ffaa00'>Deleted %1 markers</t>", _count
	];
};

true
