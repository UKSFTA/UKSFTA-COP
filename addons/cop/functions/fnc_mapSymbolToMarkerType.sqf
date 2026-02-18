/*
 * UKSFTA_COP - fn_MapSymbolToMarkerType.sqf
 * Maps a website symbol path (e.g. "/views/Campaign_02/symbols/Friendly-Infantry.png")
 * to an Arma 3 marker type (e.g. "b_inf")
 *
 * The symbol path from the website contains the symbol filename which indicates
 * the unit type and affiliation. We parse the filename and map to Arma 3's
 * NATO APP-6 marker types.
 *
 * Execution: Any
 *
 * Parameters:
 *   _symbolPath - String - Full symbol path from website JSON data
 *
 * Returns:
 *   String - Arma 3 marker type class name
 */

params [["_symbolPath", ""]];

if (_symbolPath == "") exitWith { "mil_dot" };

// Extract filename from path (everything after last /)
private _parts = _symbolPath splitString "/";
private _filename = "";
if (_parts isNotEqualTo []) then {
	_filename = _parts select -1;
};

// Remove .png extension
_filename = _filename splitString "." select 0;

// Convert to lowercase for matching
private _filenameLower = toLower _filename;

// ============================================================
// Symbol mapping table
// The website uses symbol filenames like:
//   Friendly-Infantry.png, Enemy-Armor.png, etc.
// We map these to Arma 3 marker types.
//
// Affiliation prefixes:
//   Friendly / Blufor / Allied  -> b_ (BLUFOR)
//   Enemy / Hostile / Opfor     -> o_ (OPFOR)
//   Neutral / Independent       -> n_ (Independent)
//   Unknown / Civilian          -> c_ (Civilian)
//
// Unit type suffixes:
//   Infantry / Inf              -> _inf
//   Armor / Tank                -> _armor
//   Mechanized / MechInf        -> _mech_inf
//   Motorized / MotInf          -> _motor_inf
//   Artillery / Arty            -> _art
//   AntiAir / AirDefense        -> _antiair
//   Recon / Reconnaissance      -> _recon
//   Air / Helicopter            -> _air
//   Plane / FixedWing           -> _plane
//   Naval / Ship                -> _naval
//   Medical / Med               -> _med
//   HQ / Headquarters           -> _hq
//   Support / Logistics         -> _support
//   Maintenance                 -> _maint
//   Mortar                      -> _mortar
//   UAV / Drone                 -> _uav
//   Unknown                     -> _unknown
//   Installation                -> _installation
// ============================================================

// Determine affiliation
private _prefix = "b"; // default to BLUFOR

if ((_filenameLower find "enemy" >= 0) || 
    (_filenameLower find "hostile" >= 0) || 
    (_filenameLower find "opfor" >= 0)) then {
	_prefix = "o";
} else {
	if ((_filenameLower find "neutral" >= 0) || 
	    (_filenameLower find "independent" >= 0) ||
	    (_filenameLower find "indfor" >= 0)) then {
		_prefix = "n";
	} else {
		if ((_filenameLower find "unknown" >= 0) && 
		    {_filenameLower find "infantry" < 0} && 
		    {_filenameLower find "armor" < 0}) then {
			_prefix = "n"; // Unknown affiliation -> use neutral frame
		} else {
			if (_filenameLower find "civilian" >= 0) then {
				_prefix = "c";
			};
		};
	};
};

// Determine unit type
private _suffix = "_unknown"; // default

// Check in order of specificity (longer matches first)
if ((_filenameLower find "mechanized" >= 0) || (_filenameLower find "mech_inf" >= 0) || (_filenameLower find "mechinf" >= 0)) then {
	_suffix = "_mech_inf";
} else {
	if ((_filenameLower find "motorized" >= 0) || (_filenameLower find "mot_inf" >= 0) || (_filenameLower find "motinf" >= 0) || (_filenameLower find "motor_inf" >= 0)) then {
		_suffix = "_motor_inf";
	} else {
		if ((_filenameLower find "infantry" >= 0) || (_filenameLower find "inf" >= 0 && {_filenameLower find "info" < 0})) then {
			_suffix = "_inf";
		} else {
			if ((_filenameLower find "antiair" >= 0) || (_filenameLower find "anti-air" >= 0) || (_filenameLower find "air_def" >= 0) || (_filenameLower find "airdefense" >= 0)) then {
				_suffix = "_antiair";
			} else {
				if ((_filenameLower find "armor" >= 0) || (_filenameLower find "tank" >= 0) || (_filenameLower find "anti_armor" >= 0) || (_filenameLower find "anti-armor" >= 0)) then {
					_suffix = "_armor";
				} else {
					if ((_filenameLower find "artillery" >= 0) || (_filenameLower find "arty" >= 0) || (_filenameLower find "sp_arty" >= 0)) then {
						_suffix = "_art";
					} else {
						if ((_filenameLower find "mortar" >= 0)) then {
							_suffix = "_mortar";
						} else {
							if ((_filenameLower find "recon" >= 0) || (_filenameLower find "reconnaissance" >= 0)) then {
								_suffix = "_recon";
							} else {
								if ((_filenameLower find "helicopter" >= 0) || (_filenameLower find "heli" >= 0) || (_filenameLower find "rotary" >= 0)) then {
									_suffix = "_air";
								} else {
									if ((_filenameLower find "plane" >= 0) || (_filenameLower find "fixedwing" >= 0) || (_filenameLower find "jet" >= 0)) then {
										_suffix = "_plane";
									} else {
										if ((_filenameLower find "naval" >= 0) || (_filenameLower find "ship" >= 0)) then {
											_suffix = "_naval";
										} else {
											if ((_filenameLower find "medical" >= 0) || (_filenameLower find "med" >= 0 && {_filenameLower find "media" < 0})) then {
												_suffix = "_med";
											} else {
												if ((_filenameLower find "hq" >= 0) || (_filenameLower find "headquarters" >= 0)) then {
													_suffix = "_hq";
												} else {
													if ((_filenameLower find "support" >= 0) || (_filenameLower find "logistics" >= 0)) then {
														_suffix = "_support";
													} else {
														if ((_filenameLower find "maintenance" >= 0) || (_filenameLower find "maint" >= 0)) then {
															_suffix = "_maint";
														} else {
															if ((_filenameLower find "uav" >= 0) || (_filenameLower find "drone" >= 0)) then {
																_suffix = "_uav";
															} else {
																if ((_filenameLower find "installation" >= 0) || (_filenameLower find "base" >= 0) || (_filenameLower find "fob" >= 0)) then {
																	_suffix = "_installation";
																} else {
																	if ((_filenameLower find "service" >= 0)) then {
																		_suffix = "_service";
																	} else {
																		if ((_filenameLower find "ordnance" >= 0)) then {
																			_suffix = "_Ordnance";
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
	};
};

private _markerType = format ["%1%2", _prefix, _suffix];

diag_log format ["[UKSFTA_COP] Symbol '%1' -> marker type '%2'", _symbolPath, _markerType];

_markerType
