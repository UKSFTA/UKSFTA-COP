document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let tileLayer;
    let isSyncing = false;

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey) {
        if (!theatreKey) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps || typeof window.MGRS_CRS === 'undefined') {
            log("Waiting for Precision Registry...");
            setTimeout(() => initMap(key), 200);
            return;
        }

        let config = Arma3Map.Maps[key];
        if (!config) {
            for (const [id, cfg] of Object.entries(Arma3Map.Maps)) {
                if (key.startsWith(id)) { config = cfg; break; }
            }
        }
        if (!config) config = Arma3Map.Maps["dagger_island"];
        
        if (activeTheatre === config.worldName) return;
        activeTheatre = config.worldName;
        log(`TACTICAL UPLINK: ${activeTheatre.toUpperCase()}`);

        if (map) { map.remove(); map = null; }

        const worldSize = config.worldSize || 10240;
        const padding = worldSize * 0.1; 
        const bounds = L.latLngBounds([-padding, -padding], [worldSize + padding, worldSize + padding]);

        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0,
            maxZoom: 10,
            maxBounds: bounds,
            maxBoundsViscosity: 1.0,
            zoomControl: true,
            attributionControl: false
        });

        // Initialize at Map Center
        map.setView([worldSize/2, worldSize/2], config.defaultZoom || 3);

        // Grid Layer
        L.GridLayer.Tactical = L.GridLayer.extend({
            createTile: () => {
                const tile = document.createElement('div');
                tile.style.outline = '1px solid rgba(76, 175, 80, 0.15)';
                return tile;
            }
        });
        new L.GridLayer.Tactical({ zIndex: 100 }).addTo(map);

        // Tile Delivery
        tileLayer = L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, 
            maxZoom: 10, 
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256, 
            noWrap: true,
            bounds: L.latLngBounds([0, 0], [worldSize, worldSize])
        }).addTo(map);

        tileLayer.on('tileerror', (e) => {
            console.error(`Tile 404: ${e.url}`);
        });

        // Force Re-Draw
        setTimeout(() => map.invalidateSize(), 200);
    }

    async function syncWithServer() {
        if (!SUPABASE_URL || isSyncing) return;
        isSyncing = true;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            if (session.length > 0) {
                const remote = session[0].world_name.toLowerCase();
                if (activeTheatre !== remote && !remote.startsWith(activeTheatre)) {
                    log(`Sync: ${remote}`);
                    initMap(remote);
                }
            }
        } catch (err) {}
        isSyncing = false;
    }

    window.changeTheatre = (key) => initMap(key);

    initMap("dagger_island");
    setInterval(syncWithServer, 5000);
});
