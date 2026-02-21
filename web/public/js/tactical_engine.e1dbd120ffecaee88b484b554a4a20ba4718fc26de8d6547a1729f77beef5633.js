document.addEventListener('DOMContentLoaded', () => {
    let map;
    
    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        // Default to 10240 for unit standards
        const config = (window.Arma3Map && Arma3Map.Maps[key]) ? Arma3Map.Maps[key] : { worldName: "dagger_island", worldSize: 10240, maxNativeZoom: 6 };
        
        if (map) { map.remove(); map = null; }

        // --- DIAMOND PRECISION CRS ---
        // Aligns Arma 3 [0,0] to the bottom-left of the tile grid.
        const factor = 256 / config.worldSize; // 0.025 for 10km
        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(factor, 0, -factor, 256),
            infinite: false
        });

        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: true,
            zoomAnimation: true
        }).setView([config.worldSize / 2, config.worldSize / 2], 2);

        // Tactical Grid
        L.GridLayer.Tactical = L.GridLayer.extend({
            createTile: () => {
                const tile = document.createElement('div');
                tile.style.outline = '1px solid rgba(76, 175, 80, 0.1)';
                return tile;
            }
        });
        new L.GridLayer.Tactical({ zIndex: 100 }).addTo(map);

        // Sovereign Tile Layer
        L.tileLayer(`/theatre/${config.worldName}/{z}/{x}/{y}.png`, {
            minZoom: 0,
            maxZoom: 10,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256,
            noWrap: true,
            // Force Leaflet to respect the world edges
            bounds: L.latLngBounds([0, 0], [config.worldSize, config.worldSize])
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
