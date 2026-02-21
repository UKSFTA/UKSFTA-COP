document.addEventListener('DOMContentLoaded', () => {
    let activeTheatre = "";
    let map;
    let tileLayer;

    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        const config = (window.Arma3Map && Arma3Map.Maps[key]) ? Arma3Map.Maps[key] : { worldName: "dagger_island", worldSize: 10240, maxNativeZoom: 6 };
        
        if (activeTheatre === config.worldName && map) return;
        activeTheatre = config.worldName;

        if (map) { map.remove(); map = null; }

        // --- DIAMOND CALIBRATION (10km Standard) ---
        const worldSize = config.worldSize;
        const tileSize = 256;
        const scale = tileSize / worldSize;

        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(scale, 0, -scale, tileSize),
            infinite: false
        });

        // --- CONSTRUCTOR-LEVEL INJECTION ---
        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: false
        }).setView([worldSize/2, worldSize/2], 3);

        // Grid
        L.GridLayer.Tactical = L.GridLayer.extend({
            createTile: () => {
                const tile = document.createElement('div');
                tile.style.outline = '1px solid rgba(76, 175, 80, 0.15)';
                return tile;
            }
        });
        new L.GridLayer.Tactical({ zIndex: 100 }).addTo(map);

        // Tiles
        tileLayer = L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0,
            maxZoom: 10,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        // UI Handlers
        window.changeTheatre = (newKey) => initMap(newKey);

        setTimeout(() => map.invalidateSize(), 100);
    }

    initMap("dagger_island");
});
