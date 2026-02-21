document.addEventListener('DOMContentLoaded', () => {
    let map;
    let tileLayer;

    function initMap(theatreKey) {
        const key = (theatreKey || "dagger_island").toLowerCase();
        const config = (window.Arma3Map && Arma3Map.Maps[key]) ? Arma3Map.Maps[key] : Arma3Map.Maps["dagger_island"];
        
        if (map) { map.remove(); map = null; }

        console.log("📡 TACTICAL BOOT: " + config.worldName.toUpperCase());

        // --- ATOMIC CONSTRUCTION ---
        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0,
            maxZoom: 18, // Allow extreme tactical zoom
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: false // Prevents "white-out" during transitions
        }).setView([5120, 5120], 3);

        // Sovereign Tile Layer with Mandatory Upscaling
        tileLayer = L.tileLayer(`/theatre/${config.worldName}/{z}/{x}/{y}.png`, {
            minZoom: 0,
            maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom, // DATA LIMIT
            tileSize: 256,
            noWrap: true,
            bounds: L.latLngBounds([0, 0], [10240, 10240])
        }).addTo(map);

        window.changeTheatre = (newKey) => initMap(newKey);
        setTimeout(() => map.invalidateSize(), 200);
    }

    initMap("dagger_island");
});
