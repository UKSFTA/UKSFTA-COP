window.Arma3Map = { Maps: {} };

/**
 * PRODUCTION-GRADE MGRS CRS
 * scale = tileSize / worldSize (256 / 10240 = 0.025)
 * Anchors Arma [0,0] to Visual Bottom-Left
 */
window.MGRS_CRS = function(worldSize, tileSize) {
    const scale = tileSize / worldSize;
    return L.extend({}, L.CRS.Simple, {
        transformation: new L.Transformation(scale, 0, -scale, tileSize),
        infinite: false
    });
};

const Z_VARIANTS = [
    "zagor_zagorsk_big_city", "zagor_zagorsk_biglakes", "zagor_zagorsk_countryside",
    "zagor_zagorsk_khotkovo", "zagor_zagorsk_longlake", "zagor_zagorsk_quarries",
    "zagor_zagorsk_reserved_forest", "zagor_zagorsk_trud"
];

Z_VARIANTS.forEach(v => {
    Arma3Map.Maps[v] = {
        CRS: MGRS_CRS(10240, 256),
        worldName: v,
        tilePattern: `/theatre/${v}/{z}/{x}/{y}.png`,
        maxZoom: 18, minZoom: 0, maxNativeZoom: 5,
        defaultZoom: 3, worldSize: 10240, center: [5120, 5120]
    };
});

Arma3Map.Maps.dagger_island = {
    CRS: MGRS_CRS(10240, 256),
    worldName: "dagger_island",
    tilePattern: "/theatre/dagger_island/{z}/{x}/{y}.png",
    maxZoom: 18, minZoom: 0, maxNativeZoom: 6,
    defaultZoom: 3, worldSize: 10240, center: [5120, 5120]
};
