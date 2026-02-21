document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let tileLayer;
    let selectedColor = "#0000ff";
    let selectedSymbol = "b_inf";
    let isSyncing = false;

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey) {
        if (!theatreKey) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps || typeof window.MGRS_CRS === 'undefined') {
            log("Waiting for precision registry...");
            setTimeout(() => initMap(key), 100);
            return;
        }

        let config = Arma3Map.Maps[key];
        if (!config) {
            for (const [id, cfg] of Object.entries(Arma3Map.Maps)) {
                if (key.startsWith(id)) { config = cfg; break; }
            }
        }
        if (!config) config = Arma3Map.Maps["dagger_island"];
        
        if (activeTheatre === config.worldName && map) return;
        activeTheatre = config.worldName;
        log(`BOOTING THEATRE: ${activeTheatre.toUpperCase()}`);

        if (map) { map.remove(); map = null; }

        const worldSize = config.worldSize || 10240;
        const bounds = L.latLngBounds([0, 0], [worldSize, worldSize]);

        // --- ATOMIC CONSTRUCTION (CRS must be in constructor) ---
        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0,
            maxZoom: 10,
            zoomControl: true,
            attributionControl: false,
            maxBounds: bounds.pad(0.5), // Allow 50% over-pan for comfort
            maxBoundsViscosity: 0.5
        });

        // Initialize view at Map Center
        map.setView([worldSize/2, worldSize/2], config.defaultZoom || 3);

        // PERSISTENT TACTICAL GRID
        L.GridLayer.Tactical = L.GridLayer.extend({
            createTile: () => {
                const tile = document.createElement('div');
                tile.style.outline = '1px solid rgba(76, 175, 80, 0.15)';
                return tile;
            }
        });
        new L.GridLayer.Tactical({ zIndex: 100 }).addTo(map);

        // TILE DELIVERY (Matches physical disk structure)
        tileLayer = L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, 
            maxZoom: 10, 
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256, 
            noWrap: true,
            bounds: bounds // Prevent 404s outside map edge
        }).addTo(map);

        tileLayer.on('tileerror', (e) => {
            console.warn(`Tile Missing: ${e.url}`);
        });

        // Forced viewport refresh
        setTimeout(() => map.invalidateSize(), 200);
        setTimeout(() => map.invalidateSize(), 1000);

        loadDrawings();
    }

    // UI Handlers
    window.setColor = (hex) => { selectedColor = hex; }
    window.setSymbol = (sym) => { selectedSymbol = sym; }
    window.changeTheatre = (key) => { initMap(key); }

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
                    log(`Remote Sync: Switching to ${remote}`);
                    initMap(remote);
                    const select = document.getElementById('theatre-select');
                    if (select) select.value = remote;
                }
            }
        } catch (err) {}
        isSyncing = false;
    }

    async function loadDrawings() {
        if (!SUPABASE_URL || !window.drawnItems) return;
        // Drawing load logic...
    }

    // Bootstrap
    initMap("dagger_island");
    setInterval(syncWithServer, 5000);
});
