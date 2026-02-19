document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]').content;
    const SUPABASE_SERVICE_ROLE_KEY = document.querySelector('meta[name="supabase-service-role-key"]').content;

    let map;
    let activeTheatre = "";
    let isInitializing = false;
    let selectedColor = "#0000ff";
    let selectedSymbol = "b_inf";
    let drawnItems;
    
    // Measurement State
    let isMeasuring = false;
    let measureLayer;
    let measurePoints = [];

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    const getSymbolLabel = (sym) => {
        const lookup = {
            'b_inf': 'INFANTRY', 'b_armor': 'ARMOURED', 'b_recon': 'RECON',
            'b_hq': 'HQ NODE', 'b_art': 'ARTILLERY', 'b_med': 'MEDICAL',
            'b_maint': 'MAINTENANCE', 'b_air': 'AVIATION'
        };
        return lookup[sym] || 'UNIT';
    };

    function initMap(theatreKey, isRemoteSync = false) {
        if (!theatreKey || isInitializing) return;
        const key = theatreKey.toLowerCase();
        
        if (typeof window.Arma3Map === 'undefined' || !window.Arma3Map.Maps || typeof window.MGRS_CRS === 'undefined') {
            setTimeout(() => initMap(key, isRemoteSync), 100);
            return;
        }

        const config = Arma3Map.Maps[key] || Object.values(Arma3Map.Maps)[0];
        if (isRemoteSync && activeTheatre === config.worldName) return;
        
        isInitializing = true;
        activeTheatre = config.worldName;
        log(`UPLINKING THEATRE: ${activeTheatre.toUpperCase()}`);

        if (map) { map.off(); map.remove(); map = null; document.getElementById('map').innerHTML = ""; }

        const DiamondCRS = L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(1, 128, 1, 128),
            infinite: true
        });

        map = L.map('map', {
            crs: DiamondCRS,
            minZoom: 0, maxZoom: 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false, zoomAnimation: false
        }).setView([0, 0], 3);

        L.tileLayer(`/theatre/${activeTheatre}/{z}/{x}/{y}.png`, {
            minZoom: 0, maxZoom: 18, maxNativeZoom: 6,
            tileSize: 256, noWrap: true
        }).addTo(map);

        // --- GRID TRACKER ---
        const gridRef = document.getElementById('grid-ref');
        map.on('mousemove', (e) => {
            const x = Math.floor(e.latlng.lng).toString().padStart(4, '0');
            const y = Math.floor(e.latlng.lat).toString().padStart(4, '0');
            if (gridRef) gridRef.innerText = `${x} ${y}`;
            
            if (isMeasuring && measurePoints.length > 0) {
                updateMeasureLine(e.latlng);
            }
        });

        map.on('click', (e) => {
            if (isMeasuring) {
                addMeasurePoint(e.latlng);
            }
        });

        // Drawing Layer
        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItems.setZIndex(1000);
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
            layer.feature.properties.operator = document.getElementById('operator-callsign').value || "ANON";
            layer.feature.properties.theatre = activeTheatre;
            
            const label = `[${layer.feature.properties.operator}] ${getSymbolLabel(selectedSymbol)}: ${layer.feature.properties.text}`;
            layer.bindTooltip(label, { permanent: true, direction: 'right' });
            drawnItems.addLayer(layer);
        });

        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        loadDrawings();
        setTimeout(() => { map.invalidateSize(); isInitializing = false; }, 500);
    }

    // --- RANGE MEASUREMENT LOGIC ---
    window.toggleMeasure = () => {
        isMeasuring = !isMeasuring;
        const btn = document.getElementById('measure-status');
        if (btn) {
            btn.innerText = isMeasuring ? "ACTIVE" : "OFF";
            btn.className = isMeasuring ? "text-tactical-green animate-pulse" : "text-gray-600";
        }
        
        if (!isMeasuring) {
            clearMeasure();
        } else {
            measurePoints = [];
            measureLayer = new L.FeatureGroup().addTo(map);
        }
    };

    function addMeasurePoint(latlng) {
        measurePoints.push(latlng);
        L.circleMarker(latlng, { radius: 4, color: '#4caf50', fillOpacity: 1 }).addTo(measureLayer);
        
        if (measurePoints.length > 1) {
            updateMeasureLine(latlng);
        }
    }

    function updateMeasureLine(currentLatLng) {
        if (measurePoints.length === 0) return;
        
        // Remove old temp lines
        measureLayer.eachLayer(l => { if (l instanceof L.Polyline) measureLayer.removeLayer(l); });
        
        const pts = [...measurePoints, currentLatLng];
        const line = L.polyline(pts, { color: '#4caf50', dashArray: '5, 10', weight: 2 }).addTo(measureLayer);
        
        const totalDist = calculateTotalDistance(currentLatLng);
        line.bindTooltip(`${totalDist.toFixed(0)}m`, { sticky: true, permanent: true }).openTooltip();
    }

    function calculateTotalDistance(extraPoint = null) {
        let total = 0;
        const pts = extraPoint ? [...measurePoints, extraPoint] : measurePoints;
        for (let i = 0; i < pts.length - 1; i++) {
            // Standard Euclidean distance for Simple CRS
            const dx = pts[i+1].lng - pts[i].lng;
            const dy = pts[i+1].lat - pts[i].lat;
            total += Math.sqrt(dx*dx + dy*dy);
        }
        return total;
    }

    function clearMeasure() {
        if (measureLayer) {
            map.removeLayer(measureLayer);
            measureLayer = null;
        }
        measurePoints = [];
    }

    window.setColor = (hex) => { selectedColor = hex; }
    window.setSymbol = (sym) => { selectedSymbol = sym; }
    window.changeTheatre = (key) => initMap(key, false);

    async function loadDrawings() {
        if (!SUPABASE_URL || !drawnItems) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const data = await response.json();
            drawnItems.clearLayers();
            data.forEach(d => {
                L.geoJSON(d.geojson, {
                    style: (f) => ({ color: f.properties.color || "#0000ff", weight: 3 }),
                    onEachFeature: (f, l) => {
                        const operator = f.properties.operator || "ANON";
                        const label = `[${operator}] ${getSymbolLabel(f.properties.symbol)}: ${f.properties.text || ''}`;
                        l.bindTooltip(label, { permanent: true, direction: 'right' });
                        drawnItems.addLayer(l);
                    }
                });
            });
        } catch (err) {}
    }

    document.getElementById('save-drawings').addEventListener('click', async () => {
        const status = document.querySelector('p.govuk-body-s.font-mono');
        if (status) status.innerText = "UPLOADING...";
        try {
            const data = drawnItems.toGeoJSON();
            await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.${activeTheatre}`, {
                method: 'DELETE', headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            await fetch(`${SUPABASE_URL}/rest/v1/tactical_drawings`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data.features.map(f => ({ geojson: f })))
            });
            if (status) status.innerText = "STATUS: ENCRYPTED_UPLINK";
        } catch (err) { if (status) status.innerText = "STATUS: SYNC_ERROR"; }
    });

    initMap("dagger_island");
    setInterval(loadDrawings, 15000);
});
