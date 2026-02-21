/*
 * UKSFTA_COP - fnc_updateLiveSession.sqf
 * Updates the global live session on Supabase with the current world name.
 * 
 * Execution: Server only
 * Called by: XEH_postInit
 */

if (!isServer) exitWith {};

private _worldName = worldName;
diag_log format ["[UKSFTA_COP] Updating Live Session: %1", _worldName];

private _result = "uksfta_cop_ext" callExtension format ["update_session|%1", _worldName];
diag_log format ["[UKSFTA_COP] Update Session Result: %1", _result];

true
