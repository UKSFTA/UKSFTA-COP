class Logic;
class Module_F: Logic {
    class AttributesBase {
        class ModuleDescription;
    };
    class ModuleDescription {
    };
};

class UKSFTA_COP_ModuleImportDrawings: Module_F {
    scope = 2;
    scopeCurator = 2;
    displayName = "Import Map Drawings";
    category = "UKSFTA_COP_modules";
    icon = "\a3\ui_f\data\igui\cfg\actions\settimer_ca.paa";
    function = "UKSFTA_COP_fnc_importDrawingsInit";
    functionPriority = 1;
    isGlobal = 0;
    isTriggerActivated = 0;
    isDisposable = 1;
    curatorCanAttach = 1;
    vehicleClass = "Modules";
    curatorInfoType = "RscDisplayAttributeModule";
    class Attributes: AttributesBase {
        class ModuleDescription: ModuleDescription{};
    };
    class ModuleDescription: ModuleDescription {
        description[] = {
            "Import map drawings from the planning website",
            "Opens a GUI to select a layer to import",
            "Drawings are placed as global map markers"
        };
        sync[] = {};
    };
};
