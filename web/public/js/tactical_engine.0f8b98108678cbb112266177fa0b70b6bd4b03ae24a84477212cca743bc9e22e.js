document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let map;
    let activeTheatre = "";
    let isInitializing = false;
    let selectedColor = "#0000ff";
    let selectedSymbol = "b_inf";

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    function initMap(theatreKey, isRemoteSync = false) {
        if (!theatreKey || isInitializing) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps) {
            setTimeout(() => initMap(key, isRemoteSync), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Object.values(Arma3Map.Maps)[0];
        if (isRemoteSync && activeTheatre === config.worldName) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;
        log(`UPLINKING THEATRE: ${activeTheatre.toUpperCase()}`);

        if (map) { map.off(); map.remove(); map = null; document.getElementById('map').innerHTML = ""; }

        map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: 0, maxZoom: 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false, zoomAnimation: false
        }).setView([-128, 128], 2);

        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, maxZoom: 18, maxNativeZoom: 6,
            tileSize: 256, noWrap: true
        }).addTo(map);

        // --- TACTICAL DRAWING LAYER ---
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        window.drawnItems = drawnItems;

        const drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: {
                polygon: { shapeOptions: { color: selectedColor } },
                polyline: { shapeOptions: { color: selectedColor } },
                rectangle: { shapeOptions: { color: selectedColor } },
                circle: false, circlemarker: false, marker: true
            }
        });
        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            layer.feature = layer.feature || { type: "Feature", properties: {} };
            layer.feature.properties.symbol = selectedSymbol;
            layer.feature.properties.color = selectedColor;
            layer.feature.properties.text = document.getElementById('marker-text').value || "";
            layer.feature.properties.theatre = activeTheatre;
            drawnItems.addLayer(layer);
        });

        // UI Sync
        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        loadDrawings();
        setTimeout(() => { map.invalidateSize(); isInitializing = false; }, 500);
    }

    async function syncFromRemote() {
        if (!SUPABASE_URL || isInitializing) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            if (session.length > 0) initMap(session[0].world_name, true);
        } catch (err) {}
    }

    async function loadDrawings() {
        if (!SUPABASE_URL || !window.drawnItems) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const data = await response.json();
            window.drawnItems.clearLayers();
            L.geoJSON(data.map(d => d.geojson), {
                style: (f) => ({ color: f.properties.color || "#0000ff", weight: 3 }),
                onEachFeature: (f, l) => {
                    if (f.properties.text) l.bindTooltip(f.properties.text, { permanent: true, direction: 'right' });
                }
            }).addTo(window.drawnItems);
        } catch (err) {}
    }

    document.getElementById('save-drawings').addEventListener('click', async () => {
        const status = document.getElementById('status') || document.querySelector('p.govuk-body-s.font-mono');
        status.innerText = "UPLOADING...";
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                method: 'DELETE', headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(window.drawnItems.toGeoJSON().features.map(f => ({ geojson: f })))
            });
            status.innerText = "STATUS: ENCRYPTED_UPLINK";
        } catch (err) { status.innerText = "STATUS: SYNC_ERROR"; }
    });

    window.setColor = (hex) => { selectedColor = hex; }
    window.setSymbol = (sym) => { selectedSymbol = sym; }
    window.changeTheatre = (key) => initMap(key, false);

    initMap("dagger_island");
    setInterval(syncFromRemote, 10000);
    setInterval(loadDrawings, 15000);
});
