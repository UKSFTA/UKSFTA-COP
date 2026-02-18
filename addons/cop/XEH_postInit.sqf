#include "\z\uksfta\addons\cop\script_macros.hpp"

diag_log "[UKSFTA-COP] Initializing Common Operational Picture Sync...";

UKSFTA_COP_syncInterval = 30; 
UKSFTA_COP_importedMarkers = [];

UKSFTA_COP_fnc_syncLoop = {
    if (!isServer) exitWith {};
    
    private _activeTheatre = toLower worldName;
    
    // fetch|<theatre_name>
    private _rawResult = "uksfta_cop_ext" callExtension (format ["fetch|%1", _activeTheatre]);
    
    if (_rawResult == "") exitWith {};

    try {
        private _data = parseSimpleArray _rawResult;
        
        if ((_data select 0) isEqualTo "error") then {
            diag_log format ["[UKSFTA-COP] Extension Error: %1", _data select 1];
        } else {
            [_data] call UKSFTA_COP_fnc_createMarkersFromJSON;
            diag_log format ["[UKSFTA-COP] Sync: Updated %1 features for %2.", count _data, _activeTheatre];
        };
    } catch {
        diag_log format ["[UKSFTA-COP] Sync Error: %1", _exception];
    };
};

// --- SESSION UPLINK ---
// Tells Supabase what map the server is currently on
UKSFTA_COP_fnc_broadcastSession = {
    if (!isServer) exitWith {};
    private _activeTheatre = toLower worldName;
    diag_log format ["[UKSFTA-COP] Broadcasting Live Session: %1", _activeTheatre];
    // update_session|<worldName>
    "uksfta_cop_ext" callExtension (format ["update_session|%1", _activeTheatre]);
};

if (isServer) then {
    [UKSFTA_COP_fnc_syncLoop, UKSFTA_COP_syncInterval] call CBA_fnc_addPerFrameHandler;
    
    // Broadcast session on mission start
    [] spawn {
        sleep 10;
        call UKSFTA_COP_fnc_broadcastSession;
        call UKSFTA_COP_fnc_syncLoop;
    };
};

diag_log "[UKSFTA-COP] Sync Engine Started.";
