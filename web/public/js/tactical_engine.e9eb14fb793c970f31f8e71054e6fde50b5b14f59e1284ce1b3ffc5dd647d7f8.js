document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let activeTheatre = "";
    let map;
    let isInitializing = false;

    function initMap(theatreKey) {
        if (!theatreKey || isInitializing) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            setTimeout(() => initMap(key), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Object.values(Arma3Map.Maps)[0];
        if (activeTheatre === config.worldName && map) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;

        // --- ATOMIC PURGE ---
        if (map) {
            map.off();
            map.remove();
            map = null;
        }

        // --- HARD-ANCHORED CRS ---
        // Zero-transform Simple CRS is the most stable for varying theatres
        map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: 0,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: false,
            fadeAnimation: false
        });

        // FORCE CENTER (Regardless of previous state)
        map.setView(config.center || [-128, 128], config.defaultZoom || 2);

        // Sovereign Tile Layer
        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0,
            maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom || 5,
            tileSize: 256,
            noWrap: true
        }).addTo(map);

        // UI Sync
        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        setTimeout(() => { 
            map.invalidateSize(); 
            isInitializing = false; 
        }, 400);
    }

    async function syncAndStart() {
        if (!SUPABASE_URL) { initMap("dagger_island"); return; }
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            initMap(session.length > 0 ? session[0].world_name : "dagger_island");
        } catch (err) { initMap("dagger_island"); }
    }

    window.changeTheatre = (key) => initMap(key);
    syncAndStart();
    setInterval(syncAndStart, 10000);
});
