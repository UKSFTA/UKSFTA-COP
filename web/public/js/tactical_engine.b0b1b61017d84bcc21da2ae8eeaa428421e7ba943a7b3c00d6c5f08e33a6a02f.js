document.addEventListener('DOMContentLoaded', () => {
    let map;
    
    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        const config = (window.Arma3Map && Arma3Map.Maps[key]) ? Arma3Map.Maps[key] : { worldName: "dagger_island", worldSize: 10240, maxNativeZoom: 6 };
        
        if (map) { map.remove(); map = null; }

        // --- THE "STABILITY" CRS ---
        // This math is un-breakable: 1 pixel = 1 unit at Zoom 0.
        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(1/40, 0, -1/40, 256),
            infinite: false
        });

        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: false,
            zoomAnimation: false
        }).setView([5120, 5120], 2);

        // Grid
        L.GridLayer.Tactical = L.GridLayer.extend({
            createTile: () => {
                const tile = document.createElement('div');
                tile.style.outline = '1px solid rgba(76, 175, 80, 0.1)';
                return tile;
            }
        });
        new L.GridLayer.Tactical({ zIndex: 100 }).addTo(map);

        // Tile Layer
        L.tileLayer(`/theatre/${config.worldName}/{z}/{x}/{y}.png`, {
            minZoom: 0,
            maxZoom: 10,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
