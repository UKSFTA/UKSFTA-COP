document.addEventListener('DOMContentLoaded', () => {
    let activeTheatre = "";
    let map;

    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        const config = (window.Arma3Map && Arma3Map.Maps[key]) ? Arma3Map.Maps[key] : Arma3Map.Maps["dagger_island"];
        
        if (activeTheatre === config.worldName && map) return;
        activeTheatre = config.worldName;

        console.log("📡 SOLID UPLINK: " + activeTheatre.toUpperCase());

        if (map) { map.off(); map.remove(); map = null; }

        // --- SOLID ENGINE (Animations Disabled) ---
        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0, maxZoom: 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false, zoomAnimation: false,
            markerZoomAnimation: false,
            inertia: false
        }).setView(config.center, config.defaultZoom);

        // Sovereign Tile Layer with Massive Buffer
        L.tileLayer(config.tilePattern, {
            minZoom: 0, maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256, noWrap: true,
            keepBuffer: 100, // FORCE persistence of tiles
            updateWhenZooming: true,
            updateWhenIdle: false
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
