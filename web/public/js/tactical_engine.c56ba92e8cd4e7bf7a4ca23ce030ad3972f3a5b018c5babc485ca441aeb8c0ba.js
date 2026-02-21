document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let tileLayer;
    let isInitializing = false;

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey) {
        if (!theatreKey || isInitializing) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            setTimeout(() => initMap(key), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Object.values(Arma3Map.Maps)[0];
        if (activeTheatre === config.worldName) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;
        log(`UPLINKING THEATRE: ${activeTheatre.toUpperCase()}`);

        if (map) { map.remove(); map = null; }

        // --- DIAMOND CALIBRATION (10km Center) ---
        // Aligns [0,0] to center of the tile grid for absolute stability
        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(1, 128, 1, 128),
            infinite: true
        });

        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: true,
            zoomAnimation: true
        }).setView([0, 0], 3); // Centered on [0,0] via transformation offset

        // Sovereign Tile Layer
        tileLayer = L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0,
            maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        // Update UI dropdown to match
        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        setTimeout(() => { 
            map.invalidateSize(); 
            isInitializing = false; 
        }, 500);
    }

    async function syncAndStart() {
        if (!SUPABASE_URL) { initMap("dagger_island"); return; }
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            const startMap = (session.length > 0) ? session[0].world_name : "dagger_island";
            initMap(startMap);
        } catch (err) {
            initMap("dagger_island");
        }
    }

    window.changeTheatre = (key) => initMap(key);

    // Bootstrap
    syncAndStart();
    setInterval(syncAndStart, 10000);
});
