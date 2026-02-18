document.addEventListener('DOMContentLoaded', function() {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    // --- DEFENCE INTELLIGENCE CRS (MGRS Standard) ---
    // This logic replicates official British Military mapping tools
    L.CRS.Arma3 = L.extend({}, L.CRS.Simple, {
        transformation: new L.Transformation(1, 0, -1, 0), // Standard Arma Orientation
        infinite: false
    });

    let activeTheatre = "dagger_island";
    
    // Initialize High-Fidelity Tactical Map
    var map = L.map('map', {
        crs: L.CRS.Arma3,
        minZoom: -10,
        maxZoom: 10,
        zoomControl: true,
        attributionControl: false
    }).setView([15000, 15000], -3);

    // PERSISTENT TACTICAL GRID
    L.GridLayer.Tactical = L.GridLayer.extend({
        createTile: function (coords) {
            var tile = document.createElement('div');
            tile.style.outline = '1px solid rgba(76, 175, 80, 0.15)';
            return tile;
        }
    });
    new L.GridLayer.Tactical({ zIndex: 100 }).addTo(map);

    let tileLayer;
    function setTheatre(key) {
        if (!key) return;
        activeTheatre = key.toLowerCase();
        
        if (tileLayer) map.removeLayer(tileLayer);
        
        // --- COMMUNITY INTELLIGENCE NODES ---
        // Priority Chain: Local Archive -> Jetelain (Vanilla) -> PlanOps (Modded)
        const sources = [
            `/theatre/${activeTheatre}/{z}/{x}/{y}.png`,
            `https://jetelain.github.io/Arma3Map/tiles/${activeTheatre}/{z}/{x}/{y}.png`,
            `https://tiles.plan-ops.fr/tiles/${activeTheatre}/{z}/{x}/{y}.png`
        ];

        let sourceIndex = 0;
        function tryNextSource() {
            if (sourceIndex >= sources.length) {
                console.warn(`[UKSFTA-COP] Intel Gap: Theatre ${activeTheatre} offline.`);
                document.getElementById('status').innerText = "STATUS: INTEL UNAVAILABLE";
                return;
            }
            
            if (tileLayer) map.removeLayer(tileLayer);
            
            tileLayer = L.tileLayer(sources[sourceIndex], {
                minZoom: -10,
                maxZoom: 10,
                tileSize: 256,
                noWrap: true
            }).addTo(map);

            tileLayer.on('tileload', () => {
                document.getElementById('status').innerText = `STATUS: COP LIVE (${activeTheatre.toUpperCase()})`;
            });

            tileLayer.on('tileerror', () => {
                sourceIndex++;
                tryNextSource();
            }, {once: true});
        }

        tryNextSource();
        loadDrawings();
    }

    // --- OPERATIONAL SYNC ---
    async function syncWithServer() {
        if (!SUPABASE_URL) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?select=world_name&id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const session = await response.json();
            if (session.length > 0 && session[0].world_name.toLowerCase() !== activeTheatre) {
                setTheatre(session[0].world_name);
                const select = document.getElementById('theatre-select');
                if (select) select.value = session[0].world_name.toLowerCase();
            }
        } catch (err) { console.error("Session Sync Failure:", err); }
    }

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    var selectedSymbol = "b_inf";
    var selectedColor = "#0000ff";

    var drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
            polygon: { shapeOptions: { color: selectedColor } },
            polyline: { shapeOptions: { color: selectedColor } },
            rectangle: { shapeOptions: { color: selectedColor } },
            marker: true
        }
    });
    map.addControl(drawControl);

    window.changeTheatre = function(key) { setTheatre(key); }

    map.on(L.Draw.Event.CREATED, function (e) {
        var layer = e.layer;
        layer.feature = layer.feature || {type: "Feature", properties: {}};
        layer.feature.properties.symbol = selectedSymbol;
        layer.feature.properties.color = selectedColor;
        layer.feature.properties.text = document.getElementById('marker-text').value || "";
        layer.feature.properties.theatre = activeTheatre;
        drawnItems.addLayer(layer);
    });

    async function loadDrawings() {
        if (!SUPABASE_URL) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const data = await response.json();
            drawnItems.clearLayers();
            L.geoJSON(data.map(d => d.geojson), {
                style: function(f) { return { color: f.properties.color, weight: 3 }; },
                onEachFeature: function(f, l) {
                    if (f.properties.text) l.bindTooltip(f.properties.text, { permanent: true, direction: 'right' });
                }
            }).addTo(drawnItems);
        } catch (err) { console.error("Sync Failure:", err); }
    }

    document.getElementById('save-drawings').addEventListener('click', async function() {
        const data = drawnItems.toGeoJSON();
        const status = document.getElementById('status');
        status.innerText = "UPLOADING TRACE...";
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data.features.map(f => ({ geojson: f })))
            });
            if (response.ok) status.innerText = "COP UPDATED";
        } catch (err) { status.innerText = "COMMS ERROR"; }
    });

    // Initial setup
    setTheatre(activeTheatre);
    setInterval(syncWithServer, 5000);
    setInterval(loadDrawings, 15000);
});
