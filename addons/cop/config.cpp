#include "script_macros.hpp"

class CfgPatches {
    class UKSFTA_COP_Main {
        name = "UKSF Taskforce Alpha - COP Main";
        units[] = {
            "UKSFTA_COP_ModuleImportDrawings"
        };
        weapons[] = {};
        requiredVersion = 1.62;
        requiredAddons[] = {"cba_main", "A3_Modules_F"};
        author = "UKSF Taskforce Alpha Team";
        authors[] = {"UKSF Taskforce Alpha Team"};
        url = "https://github.com/UKSFTA/UKSFTA-COP";
        version = "1.0.0";
        versionStr = "1.0.0";
        versionAr[] = {1,0,0};
    };
};

class CfgFactionClasses {
    class UKSFTA_COP_modules {
        displayName = "UKSFTA COP";
        priority = 3;
        side = 7;
    };
};

class CfgFunctions {
    class UKSFTA_COP {
        tag = "UKSFTA_COP";
        class COMPONENT {
            file = "z\uksfta\addons\cop\functions";
            #define PREP(fnc) class fnc {}
            #include "XEH_PREP.hpp"
        };
    };
};

#include "CfgUI.hpp"

class CfgVehicles {
    #include "CfgModules.hpp"
};

class Extended_PostInit_EventHandlers {
    class UKSFTA_COP_Main {
        init = "call UKSFTA_COP_fnc_requestMaps";
    };
};
