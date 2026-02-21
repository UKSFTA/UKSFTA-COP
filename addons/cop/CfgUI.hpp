class RscText;
class RscButton;
class RscListbox;
class RscStructuredText;
class RscCombo;

// --- UKSFTA Tactical UI Base Classes ---
class UKSFTA_COP_RscTitle : RscText {
    font = "EtelkaNarrowMediumPro";
    sizeEx = 0.045;
    colorBackground[] = {0, 0, 0, 1};
    colorText[] = {0.3, 0.6, 0.3, 1}; // Tactical Green
    shadow = 0;
};

class UKSFTA_COP_RscHeader : RscText {
    font = "EtelkaNarrowMediumPro";
    sizeEx = 0.035;
    colorBackground[] = {0.1, 0.1, 0.1, 1};
    colorText[] = {0.8, 0.8, 0.8, 1};
    shadow = 0;
};

class UKSFTA_COP_RscButton : RscButton {
    font = "EtelkaNarrowMediumPro";
    sizeEx = 0.035;
    colorBackground[] = {0.05, 0.05, 0.05, 1};
    colorBackgroundActive[] = {0.3, 0.6, 0.3, 1};
    colorFocused[] = {0.3, 0.6, 0.3, 0.2};
    colorText[] = {1, 1, 1, 1};
    borderSize = 0;
    shadow = 0;
};

class UKSFTA_COP_RscButtonAction : UKSFTA_COP_RscButton {
    colorBackground[] = {0.15, 0.35, 0.15, 1};
    colorBackgroundActive[] = {0.2, 0.55, 0.2, 1};
};

class UKSFTA_COP_RscButtonCancel : UKSFTA_COP_RscButton {
    colorBackground[] = {0.4, 0.15, 0.15, 1};
    colorBackgroundActive[] = {0.5, 0.2, 0.2, 1};
};

class UKSFTA_COP_LayerSelectDialog {
    idd = 143501;
    movingEnable = 1;
    enableSimulation = 1;
    class ControlsBackground {
        class Backdrop: RscText {
            idc = -1;
            x = "safezoneX";
            y = "safezoneY";
            w = "safezoneW";
            h = "safezoneH";
            colorBackground[] = {0, 0, 0, 0.4};
        };
        class Background: RscText {
            idc = -1;
            x = "(0.29375 * safezoneW + safezoneX)";
            y = "(0.20 * safezoneH + safezoneY)";
            w = "(0.4125 * safezoneW)";
            h = "(0.60 * safezoneH)";
            colorBackground[] = {0.05, 0.05, 0.05, 0.98};
        };
        class TitleBar: UKSFTA_COP_RscTitle {
            idc = -1;
            text = "  INTELLIGENCE COMMAND PORTAL - IMPORT DRAWINGS";
            x = "(0.29375 * safezoneW + safezoneX)";
            y = "(0.178 * safezoneH + safezoneY)";
            w = "(0.4125 * safezoneW)";
            h = "(0.025 * safezoneH)";
        };
        class ClassificationBanner: RscText {
            idc = -1;
            text = "OFFICIAL-SENSITIVE // UK EYES ONLY";
            x = "(0.29375 * safezoneW + safezoneX)";
            y = "(0.775 * safezoneH + safezoneY)";
            w = "(0.4125 * safezoneW)";
            h = "(0.02 * safezoneH)";
            colorBackground[] = {0, 0, 0, 1};
            colorText[] = {1, 1, 1, 0.5};
            sizeEx = 0.025;
            style = 2; // Center
        };
    };
    class Controls {
        class MapSelectLabel: RscText {
            idc = -1;
            text = "AREA OF OPERATIONS:";
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.215 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.03 * safezoneH)";
            sizeEx = 0.03;
            font = "EtelkaNarrowMediumPro";
        };
        class MapSelectCombo: RscCombo {
            idc = 1510;
            x = "(0.39 * safezoneW + safezoneX)";
            y = "(0.215 * safezoneH + safezoneY)";
            w = "(0.21 * safezoneW)";
            h = "(0.03 * safezoneH)";
            sizeEx = 0.035;
            colorBackground[] = {0.1, 0.1, 0.1, 1};
            font = "RobotoCondensed";
        };
        class RefreshButton: UKSFTA_COP_RscButton {
            idc = 1520;
            text = "REFRESH UPLINK";
            x = "(0.61 * safezoneW + safezoneX)";
            y = "(0.215 * safezoneH + safezoneY)";
            w = "(0.085 * safezoneW)";
            h = "(0.03 * safezoneH)";
            onButtonClick = "[] call UKSFTA_COP_fnc_openLayerSelectGUI;";
        };
        class HeaderLayer: UKSFTA_COP_RscHeader {
            idc = -1;
            text = " INTELLIGENCE LAYER";
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.255 * safezoneH + safezoneY)";
            w = "(0.22 * safezoneW)";
            h = "(0.025 * safezoneH)";
        };
        class HeaderCount: UKSFTA_COP_RscHeader {
            idc = -1;
            text = "DRAWINGS";
            x = "(0.53 * safezoneW + safezoneX)";
            y = "(0.255 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.025 * safezoneH)";
            style = 2;
        };
        class HeaderTypes: UKSFTA_COP_RscHeader {
            idc = -1;
            text = "COMPOSITION";
            x = "(0.615 * safezoneW + safezoneX)";
            y = "(0.255 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.025 * safezoneH)";
            style = 2;
        };
        class LayerListBox: RscListbox {
            idc = 1500;
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.282 * safezoneH + safezoneY)";
            w = "(0.391875 * safezoneW)";
            h = "(0.40 * safezoneH)";
            sizeEx = 0.035;
            colorBackground[] = {0.08, 0.08, 0.08, 1};
            font = "RobotoCondensed";
        };
        class StatusText: RscStructuredText {
            idc = 1501;
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.69 * safezoneH + safezoneY)";
            w = "(0.391875 * safezoneW)";
            h = "(0.025 * safezoneH)";
            sizeEx = 0.03;
            colorBackground[] = {0,0,0,0.5};
        };
        class ImportButton: UKSFTA_COP_RscButtonAction {
            idc = 1600;
            text = "IMPORT INTELLIGENCE TO COP";
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.73 * safezoneH + safezoneY)";
            w = "(0.18 * safezoneW)";
            h = "(0.035 * safezoneH)";
            onButtonClick = "[] call UKSFTA_COP_fnc_importLayer;";
        };
        class DeleteMarkersButton: UKSFTA_COP_RscButtonCancel {
            idc = 1601;
            text = "PURGE LOCAL MARKERS";
            x = "(0.50 * safezoneW + safezoneX)";
            y = "(0.73 * safezoneH + safezoneY)";
            w = "(0.10 * safezoneW)";
            h = "(0.035 * safezoneH)";
            onButtonClick = "[] call UKSFTA_COP_fnc_deleteImportedMarkers;";
        };
        class CancelButton: UKSFTA_COP_RscButton {
            idc = 1602;
            text = "CLOSE";
            x = "(0.615 * safezoneW + safezoneX)";
            y = "(0.73 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.035 * safezoneH)";
            onButtonClick = "closeDialog 0;";
        };
    };
};
