document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let tileLayer;
    let selectedColor = "#0000ff";
    let selectedSymbol = "b_inf";

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey) {
        if (!theatreKey) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            setTimeout(() => initMap(key), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Arma3Map.Maps["dagger_island"];
        if (activeTheatre === config.worldName) return;
        activeTheatre = config.worldName;

        log(`FORCING ATOMIC UPLINK: ${activeTheatre.toUpperCase()}`);

        if (map) map.remove();

        // NAKED CRS FIRST (Most stable)
        map = L.map('map', {
            crs: L.CRS.Simple,
            zoomControl: true,
            attributionControl: false,
            minZoom: -5,
            maxZoom: 10
        });

        // Use the Diamond Tier Transformation from Registry
        map.options.crs = config.CRS;

        // TILE DELIVERY (Direct Path)
        const tileUrl = "/theatre/" + activeTheatre + "/{z}/{x}/{y}.png";
        log(`Tile Path: ${tileUrl}`);

        tileLayer = L.tileLayer(tileUrl, {
            minZoom: 0,
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        tileLayer.on('tileload', (e) => log("Tile Loaded: " + e.url));
        tileLayer.on('tileerror', (e) => console.error("Tile 404: " + e.url));

        // CENTER VIEW
        const worldSize = config.worldSize || 10240;
        map.setView([worldSize / 2, worldSize / 2], 3);

        // --- VISUAL DIAGNOSTIC ---
        L.circle([worldSize/2, worldSize/2], { radius: 500, color: 'red' }).addTo(map).bindTooltip("AOR CENTER").openTooltip();

        // RECURSIVE VIEWPORT REFRESH (Definitively fixes "invisible map" issues)
        let refreshCount = 0;
        const refresh = setInterval(() => {
            map.invalidateSize();
            refreshCount++;
            if (refreshCount > 10) clearInterval(refresh);
        }, 500);

        loadDrawings();
    }

    // UI Handlers
    window.setColor = (hex) => { selectedColor = hex; }
    window.setSymbol = (sym) => { selectedSymbol = sym; }
    window.changeTheatre = (key) => { initMap(key); }

    async function syncWithServer() {
        if (!SUPABASE_URL) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            if (session.length > 0) {
                const remote = session[0].world_name.toLowerCase();
                if (!activeTheatre.startsWith(remote) && activeTheatre !== remote) initMap(remote);
            }
        } catch (err) {}
    }

    async function loadDrawings() {
        if (!SUPABASE_URL || !window.drawnItems) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const data = await response.json();
            // Drawing logic here...
        } catch (err) {}
    }

    initMap("dagger_island");
    setInterval(syncWithServer, 5000);
});
