document.addEventListener('DOMContentLoaded', () => {
    let map;
    
    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        const config = (window.Arma3Map && Arma3Map.Maps[key]) ? Arma3Map.Maps[key] : Arma3Map.Maps["dagger_island"];
        
        if (map) { map.remove(); map = null; }

        console.log("📡 ATOMIC UPLINK: " + config.worldName.toUpperCase());

        // --- ZERO-RESTRICTION CONSTRUCTION ---
        map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: 0,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: false,
            zoomAnimation: false,
            maxBounds: null // DEFINITIVELY REMOVE CLIPPING
        }).setView(config.center, config.defaultZoom);

        // Sovereign Tile Layer
        L.tileLayer(config.tilePattern, {
            minZoom: 0,
            maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256,
            noWrap: true,
            bounds: null // NO CLIPPING
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
