document.addEventListener('DOMContentLoaded', () => {
    let map;
    
    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        
        if (map) { map.off(); map.remove(); map = null; }

        console.log("📡 TACTICAL UPLINK: " + key.toUpperCase());

        // --- THE "GOD-MODE" ENGINE (Zero Math, Zero Clipping) ---
        map = L.map('map', {
            crs: L.CRS.Simple, // Raw Pixels
            minZoom: 0,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: false,
            zoomAnimation: false
        }).setView([-128, 128], 2); // Perfectly centered on the Zoom 0 tile (256px)

        // Sovereign Tile Layer
        L.tileLayer('/theatre/' + key + '/{z}/{x}/{y}.png', {
            minZoom: 0, maxZoom: 18,
            maxNativeZoom: 6,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
