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
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            log("Waiting for Registry...");
            setTimeout(() => initMap(key), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Arma3Map.Maps["dagger_island"];
        if (activeTheatre === config.worldName && map) return;
        
        activeTheatre = config.worldName;
        log(`ACTOR READY: ${activeTheatre.toUpperCase()}`);

        if (map) { map.remove(); map = null; }

        // --- STABILITY ENGINE (Constructor-First) ---
        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false,
            // REMOVE BOUNDS RESTRICTION FOR DIAGNOSTIC
            maxBounds: null,
            fadeAnimation: false, // Prevents "hidden while zooming" flickering
            zoomAnimation: false  // Maximum rendering stability
        });

        const worldSize = config.worldSize || 10240;
        map.setView([worldSize/2, worldSize/2], config.defaultZoom || 2);

        // Grid Layer
        L.GridLayer.Tactical = L.GridLayer.extend({
            createTile: () => {
                const tile = document.createElement('div');
                tile.style.outline = '1px solid rgba(76, 175, 80, 0.1)';
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
            noWrap: true
        }).addTo(map);

        tileLayer.on('tileerror', (e) => console.error("404: " + e.url));

        // FORCE SIZE CALCULATION
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 500);
    }

    // UI & Sync Logic
    window.changeTheatre = (key) => initMap(key);
    
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
                    initMap(remote);
                    const select = document.getElementById('theatre-select');
                    if (select) select.value = remote;
                }
            }
        } catch (err) {}
        isSyncing = false;
    }

    initMap("dagger_island");
    setInterval(syncWithServer, 5000);
});
