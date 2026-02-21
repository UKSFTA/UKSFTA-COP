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
        if (activeTheatre === config.worldName) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;
        log(`UPLINKING THEATRE: ${activeTheatre.toUpperCase()}`);

        if (map) { map.off(); map.remove(); map = null; }

        // --- DIAMOND CALIBRATION (Perfect Center Anchor) ---
        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(1, 128, 1, 128),
            infinite: true
        });

        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0, maxZoom: 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false
        }).setView([0, 0], 3);

        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256, noWrap: true
        }).addTo(map);

        // Update UI
        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        // Force layout stability
        setTimeout(() => { map.invalidateSize(); isInitializing = false; }, 400);

        // Update Database if manually triggered
        if (updateRemote && SUPABASE_URL) {
            fetch(`${SUPABASE_URL}/rest/v1/live_session?id=eq.1`, {
                method: 'PATCH',
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ world_name: activeTheatre })
            }).then(() => log("Remote Session Updated."));
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
                // ONLY trigger if the database value is truly different from local state
                if (activeTheatre !== remote && !remote.startsWith(activeTheatre)) {
                    log(`Remote Sync Triggered: ${remote}`);
                    initMap(remote, false);
                }
            }
        } catch (err) {}
    }

    window.changeTheatre = (key) => initMap(key, true);

    // Initial Bootstrap
    syncFromRemote().then(() => {
        if (!activeTheatre) initMap("dagger_island", false);
    });

    setInterval(syncFromRemote, 10000);
});
