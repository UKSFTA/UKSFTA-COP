class RscText;
class RscButton;
class RscListbox;
class RscStructuredText;
class RscCombo;

class UKSFTA_COP_FlatButton {
    type = 1;
    style = 2;
    shadow = 0;
    colorText[] = {1,1,1,1};
    colorDisabled[] = {0.5,0.5,0.5,1};
    colorBackground[] = {0,0,0,0};
    colorBackgroundActive[] = {1,1,1,0.1};
    colorBackgroundDisabled[] = {0,0,0,0};
    colorFocused[] = {1,1,1,0.05};
    colorShadow[] = {0,0,0,0};
    colorBorder[] = {0,0,0,0};
    borderSize = 0;
    font = "RobotoCondensed";
    sizeEx = 0.04;
    text = "";
    offsetX = 0;
    offsetY = 0;
    offsetPressedX = 0;
    offsetPressedY = 0;
    soundEnter[] = {"\A3\ui_f\data\sound\RscButton\soundEnter",0.09,1};
    soundPush[] = {"\A3\ui_f\data\sound\RscButton\soundPush",0.09,1};
    soundClick[] = {"\A3\ui_f\data\sound\RscButton\soundClick",0.09,1};
    soundEscape[] = {"\A3\ui_f\data\sound\RscButton\soundEscape",0.09,1};
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
            colorBackground[] = {0, 0, 0, 0.5};
        };
        class Background: RscText {
            idc = -1;
            x = "(0.29375 * safezoneW + safezoneX)";
            y = "(0.20 * safezoneH + safezoneY)";
            w = "(0.4125 * safezoneW)";
            h = "(0.60 * safezoneH)";
            colorBackground[] = {0.1, 0.1, 0.1, 0.95};
        };
        class TitleBar: RscText {
            idc = -1;
            text = "  UKSFTA COP - Import Map Drawings";
            x = "(0.29375 * safezoneW + safezoneX)";
            y = "(0.178 * safezoneH + safezoneY)";
            w = "(0.4125 * safezoneW)";
            h = "(0.022 * safezoneH)";
            colorBackground[] = {0.15, 0.35, 0.15, 1};
            sizeEx = 0.04;
        };
    };
    class Controls {
        class MapSelectLabel: RscText {
            idc = -1;
            text = "Map:";
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.215 * safezoneH + safezoneY)";
            w = "(0.04 * safezoneW)";
            h = "(0.03 * safezoneH)";
            sizeEx = 0.035;
        };
        class MapSelectCombo: RscCombo {
            idc = 1510;
            x = "(0.35 * safezoneW + safezoneX)";
            y = "(0.215 * safezoneH + safezoneY)";
            w = "(0.25 * safezoneW)";
            h = "(0.03 * safezoneH)";
            sizeEx = 0.035;
            colorBackground[] = {0.15, 0.15, 0.15, 1};
        };
        class RefreshButton: RscButton {
            idc = 1520;
            text = "Refresh";
            x = "(0.61 * safezoneW + safezoneX)";
            y = "(0.215 * safezoneH + safezoneY)";
            w = "(0.085 * safezoneW)";
            h = "(0.03 * safezoneH)";
            colorBackground[] = {0.2, 0.2, 0.2, 1};
            colorBackgroundActive[] = {0.3, 0.3, 0.3, 1};
            sizeEx = 0.033;
            onButtonClick = "[] call UKSFTA_COP_fnc_openLayerSelectGUI;";
        };
        class HeaderLayer: RscText {
            idc = -1;
            text = "Layer Name";
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.255 * safezoneH + safezoneY)";
            w = "(0.22 * safezoneW)";
            h = "(0.025 * safezoneH)";
            colorBackground[] = {0.2, 0.2, 0.2, 1};
            sizeEx = 0.032;
        };
        class HeaderCount: RscText {
            idc = -1;
            text = "Drawings";
            x = "(0.53 * safezoneW + safezoneX)";
            y = "(0.255 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.025 * safezoneH)";
            colorBackground[] = {0.2, 0.2, 0.2, 1};
            sizeEx = 0.032;
        };
        class HeaderTypes: RscText {
            idc = -1;
            text = "Types";
            x = "(0.615 * safezoneW + safezoneX)";
            y = "(0.255 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.025 * safezoneH)";
            colorBackground[] = {0.2, 0.2, 0.2, 1};
            sizeEx = 0.032;
        };
        class LayerListBox: RscListbox {
            idc = 1500;
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.282 * safezoneH + safezoneY)";
            w = "(0.391875 * safezoneW)";
            h = "(0.43 * safezoneH)";
            sizeEx = 0.035;
            colorBackground[] = {0.12, 0.12, 0.12, 1};
        };
        class StatusText: RscStructuredText {
            idc = 1501;
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.72 * safezoneH + safezoneY)";
            w = "(0.391875 * safezoneW)";
            h = "(0.025 * safezoneH)";
            sizeEx = 0.03;
        };
        class ImportButton: RscButton {
            idc = 1600;
            text = "Import Selected Layer";
            x = "(0.304063 * safezoneW + safezoneX)";
            y = "(0.75 * safezoneH + safezoneY)";
            w = "(0.18 * safezoneW)";
            h = "(0.04 * safezoneH)";
            colorBackground[] = {0.15, 0.45, 0.15, 1};
            colorBackgroundActive[] = {0.2, 0.55, 0.2, 1};
            sizeEx = 0.038;
            onButtonClick = "[] call UKSFTA_COP_fnc_importLayer;";
        };
        class DeleteMarkersButton: RscButton {
            idc = 1601;
            text = "Delete All Imported Markers";
            x = "(0.50 * safezoneW + safezoneX)";
            y = "(0.75 * safezoneH + safezoneY)";
            w = "(0.10 * safezoneW)";
            h = "(0.04 * safezoneH)";
            colorBackground[] = {0.5, 0.15, 0.15, 1};
            colorBackgroundActive[] = {0.6, 0.2, 0.2, 1};
            sizeEx = 0.033;
            onButtonClick = "[] call UKSFTA_COP_fnc_deleteImportedMarkers;";
        };
        class CancelButton: RscButton {
            idc = 1602;
            text = "Close";
            x = "(0.615 * safezoneW + safezoneX)";
            y = "(0.75 * safezoneH + safezoneY)";
            w = "(0.08 * safezoneW)";
            h = "(0.04 * safezoneH)";
            colorBackground[] = {0.4, 0.15, 0.15, 1};
            colorBackgroundActive[] = {0.5, 0.2, 0.2, 1};
            sizeEx = 0.038;
            onButtonClick = "closeDialog 0;";
        };
    };
};
