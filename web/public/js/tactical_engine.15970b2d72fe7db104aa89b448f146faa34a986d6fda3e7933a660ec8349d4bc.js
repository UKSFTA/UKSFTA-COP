document.addEventListener('DOMContentLoaded', () => {
    let map;
    
    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        
        if (map) { map.remove(); map = null; }

        console.log("📡 UPLINKING THEATRE: " + key);

        // --- THE "GOD-MODE" CRS (Zero Math, Zero Clipping) ---
        map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: 0,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false
        }).setView([-128, 128], 2); // Center on the Zoom 0 tile

        // Tiles - Standard XYZ structure
        L.tileLayer('/theatre/' + key + '/{z}/{x}/{y}.png', {
            minZoom: 0,
            maxZoom: 10,
            maxNativeZoom: 6,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        
        // Force rendering
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
