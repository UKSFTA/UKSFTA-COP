document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let map;
    let activeTheatre = "";
    let isInitializing = false;

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey, isRemoteSync = false) {
        if (!theatreKey || isInitializing) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            setTimeout(() => initMap(key, isRemoteSync), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Object.values(Arma3Map.Maps)[0];
        
        // If this is a remote sync, only update if it's actually a different map
        if (isRemoteSync && activeTheatre === config.worldName) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;
        log(`UPLINKING THEATRE: ${activeTheatre.toUpperCase()}`);

        // --- ATOMIC PURGE ---
        if (map) {
            map.off();
            map.remove();
            map = null;
            // Clear the container physically to be absolutely safe
            document.getElementById('map').innerHTML = ""; 
        }

        // --- STABLE CRS CONSTRUCTION ---
        map = L.map('map', {
            crs: config.CRS,
            minZoom: 0, maxZoom: 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false, zoomAnimation: false
        });

        // Set View to precise center
        map.setView(config.center, config.defaultZoom);

        // Tile Delivery
        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, maxZoom: 18,
            maxNativeZoom: config.maxNativeZoom,
            tileSize: 256, noWrap: true
        }).addTo(map);

        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        // Final Stabilization
        setTimeout(() => { 
            map.invalidateSize({ animate: false }); 
            isInitializing = false; 
        }, 500);

        // Update Remote Session
        if (!isRemoteSync && SUPABASE_URL) {
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
                initMap(session[0].world_name, true);
            }
        } catch (err) {}
    }

    window.changeTheatre = (key) => initMap(key, false);
    syncFromRemote().then(() => { if (!activeTheatre) initMap("dagger_island", false); });
    setInterval(syncFromRemote, 10000);
});
