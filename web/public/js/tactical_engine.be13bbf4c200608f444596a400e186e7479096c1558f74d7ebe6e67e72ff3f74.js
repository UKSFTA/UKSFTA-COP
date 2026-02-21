document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let isInitializing = false;

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

        if (map) { map.off(); map.remove(); map = null; }

        // --- ATOMIC CONSTRUCTION (Physical Scale) ---
        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0, maxZoom: 10,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false, zoomAnimation: true
        });

        // TILE DELIVERY (Physical Bounds)
        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, maxZoom: 10,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256, noWrap: true,
            bounds: L.latLngBounds([0, 0], [config.worldSize, config.worldSize])
        }).addTo(map);

        // FORCE VIEWPORT CALCULATION BEFORE CENTERING
        map.invalidateSize({ animate: false });
        map.setView(config.center, config.defaultZoom);

        // UI Sync
        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        // Final Stabilization
        setTimeout(() => { map.invalidateSize(); isInitializing = false; }, 300);

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
