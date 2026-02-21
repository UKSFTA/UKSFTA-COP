document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let isInitializing = false;

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey, updateRemote = false) {
        if (!theatreKey || isInitializing) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            setTimeout(() => initMap(key, updateRemote), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Object.values(Arma3Map.Maps)[0];
        if (activeTheatre === config.worldName && map) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;
        log(`UPLINKING THEATRE: ${activeTheatre.toUpperCase()}`);

        if (map) { map.off(); map.remove(); map = null; }

        // --- DYNAMIC DIAMOND CALIBRATION ---
        const worldSize = config.worldSize || 10240;
        const scaleFactor = 256 / worldSize; // Maps world meters to Zoom 0 pixels

        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            // Transformation: scaleX, offsetX, scaleY, offsetY
            // Maps [0,0] Arma to [0, 256] Pixel (Bottom-Left)
            transformation: new L.Transformation(scaleFactor, 0, -scaleFactor, 256),
            infinite: true
        });

        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0, maxZoom: 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false
        });

        // Set View to exact center of the world [5120, 5120]
        map.setView([worldSize/2, worldSize/2], 3);

        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256, noWrap: true
        }).addTo(map);

        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        setTimeout(() => { map.invalidateSize(); isInitializing = false; }, 400);

        if (updateRemote && SUPABASE_URL) {
            fetch(`${SUPABASE_URL}/rest/v1/live_session?id=eq.1`, {
                method: 'PATCH',
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ world_name: activeTheatre })
            });
        }
    }

    async function syncFromRemote() {
        if (!SUPABASE_URL || isInitializing) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            if (session.length > 0) {
                const remote = session[0].world_name.toLowerCase();
                if (activeTheatre !== remote && !remote.startsWith(activeTheatre)) {
                    initMap(remote, false);
                }
            }
        } catch (err) {}
    }

    window.changeTheatre = (key) => initMap(key, true);
    syncFromRemote().then(() => { if (!activeTheatre) initMap("dagger_island", false); });
    setInterval(syncFromRemote, 10000);
});
