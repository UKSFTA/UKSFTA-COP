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

    let gridLayer;
    let mapStyle = "os";

    const log = (msg) => console.log(`%c[UKSFTA-COP]%c ${msg}`, "color: #4caf50; font-weight: bold", "color: #e0e0e0");

    window.setMapStyle = (style) => {
        mapStyle = style;
        const mapEl = document.getElementById('map');
        if (mapEl) {
            mapEl.classList.remove('map-style-os', 'map-style-military');
            mapEl.classList.add(`map-style-${style}`);
        }
    };

    window.toggleGrid = (visible) => {
        if (!map) return;
        if (visible) {
            if (!gridLayer) createGrid();
            map.addLayer(gridLayer);
        } else {
            if (gridLayer) map.removeLayer(gridLayer);
        }
    };

    function createGrid() {
        gridLayer = L.layerGroup();
        if (!activeTheatre || !Arma3Map.Maps[activeTheatre]) return;
        const config = Arma3Map.Maps[activeTheatre];
        const worldSize = config.worldSize || 10240;
        
        // Horizontal Lines (Northing)
        for (let y = 0; y <= worldSize; y += 1000) {
            L.polyline([[y, 0], [y, worldSize]], {
                color: 'blue', weight: 0.5, opacity: 0.2, interactive: false
            }).addTo(gridLayer);
            
            // East side label
            L.marker([y, 0], {
                icon: L.divIcon({
                    className: 'grid-label',
                    html: (y/100).toString().padStart(2, '0'),
                    iconSize: [20, 20]
                }),
                interactive: false
            }).addTo(gridLayer);
        }

        // Vertical Lines (Easting)
        for (let x = 0; x <= worldSize; x += 1000) {
            L.polyline([[0, x], [worldSize, x]], {
                color: 'blue', weight: 0.5, opacity: 0.2, interactive: false
            }).addTo(gridLayer);

            // Bottom label
            L.marker([0, x], {
                icon: L.divIcon({
                    className: 'grid-label',
                    html: (x/100).toString().padStart(2, '0'),
                    iconSize: [20, 20]
                }),
                interactive: false
            }).addTo(gridLayer);
        }
    }

    async function logAudit(type, actor = "WEB_PORTAL", details = "") {
        if (!SUPABASE_URL) return;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/tactical_logs`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_type: type, actor: actor, details: details })
            });
        } catch (err) {}
    }

    // Attach unlock logic to window so index.html can call it
    window.unlockPortal = () => {
        document.getElementById('access-control').style.display = 'none';
        document.getElementById('portal-content').style.display = 'flex';
        logAudit("ACCESS_GRANTED", "USER_ANON", "Portal unlocked via Entry Screen");
        if (window.dispatchEvent) {
            window.dispatchEvent(new Event('resize'));
        }
        if (map) map.invalidateSize();
    };

    const getSymbolLabel = (sym) => {
        const lookup = {
            'b_inf': 'INFANTRY', 'b_motor_inf': 'MOTORIZED INF', 'b_mech_inf': 'MECHANIZED INF',
            'b_armor': 'ARMOURED', 'b_recon': 'RECON (CAV)', 'b_hq': 'HQ NODE',
            'b_art': 'ARTILLERY', 'b_mor': 'MORTARS', 'b_med': 'MEDICAL',
            'b_eng': 'ENGINEERS', 'b_air': 'AVIATION (RW)', 'b_uav': 'UAV (WATCHKEEPER)',
            'b_log': 'LOGISTICS', 'b_maint': 'MAINTENANCE'
        };
        return lookup[sym] || 'UNIT';
    };

    async function checkLiveSession() {
        if (!SUPABASE_URL) return;
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/live_session?id=eq.1`, {
                headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
            });
            const data = await response.json();
            const statusEl = document.getElementById('session-status');
            const theatreEl = document.getElementById('active-theatre-display');
            
            if (data && data.length > 0) {
                const liveTheatre = data[0].world_name;
                const lastUpdated = new Date(data[0].last_updated);
                const now = new Date();
                const isFresh = (now - lastUpdated) < 60000; // 1 minute threshold

                if (statusEl) {
                    statusEl.innerText = isFresh ? "LIVE" : "STALE";
                    statusEl.className = isFresh ? "govuk-tag govuk-tag--green" : "govuk-tag govuk-tag--yellow";
                }
                if (theatreEl) theatreEl.innerText = liveTheatre.toUpperCase();
                
                // Auto-switch if no active theatre yet
                if (!activeTheatre && isFresh) {
                    initMap(liveTheatre);
                }
            } else {
                if (statusEl) {
                    statusEl.innerText = "OFFLINE";
                    statusEl.className = "govuk-tag govuk-tag--grey";
                }
            }
        } catch (err) {
            log("Session check failed: " + err);
        }
    }

    function formatMGRS(lng, lat) {
        // Simple 8-figure grid for UKSFTA (4 easting, 4 northing)
        // In a real MGRS system we'd need grid zone designators, 
        // but for Arma maps we usually just use the raw coordinates.
        const e = Math.floor(lng).toString().padStart(4, '0');
        const n = Math.floor(lat).toString().padStart(4, '0');
        return `${e.substring(0,2)} ${e.substring(2,4)} ${n.substring(0,2)} ${n.substring(2,4)}`;
    }

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

        // Use the CRS from the config (which uses MGRS_CRS factory)
        const crs = config.CRS || L.CRS.Simple;
        const worldSize = config.worldSize || 10240;
        const tileSize = config.tileSize || 256;
        const folderOffset = config.folderOffset || 0;
        const bounds = [[0, 0], [worldSize, worldSize]];

        map = L.map('map', {
            crs: crs,
            minZoom: config.minZoom || 0, 
            maxZoom: config.maxZoom || 18,
            zoomControl: true, attributionControl: false,
            fadeAnimation: false, zoomAnimation: false,
            maxBounds: bounds
        }).setView(config.center || [worldSize / 2, worldSize / 2], config.defaultZoom || 3);

        const TacticalLayer = L.TileLayer.extend({
            getTileUrl: function(coords) {
                const z = coords.z + folderOffset;
                return L.Util.template(this._url, {
                    z: z,
                    x: coords.x,
                    y: coords.y
                });
            }
        });

        new TacticalLayer(config.tilePattern, {
            minZoom: config.minZoom || 0, 
            maxZoom: config.maxZoom || 18, 
            maxNativeZoom: config.maxNativeZoom || 6,
            tileSize: tileSize, 
            noWrap: true,
            bounds: bounds
        }).addTo(map);

        // --- GRID TRACKER ---
        const gridRef = document.getElementById('grid-ref');
        map.on('mousemove', (e) => {
            const grid = formatMGRS(e.latlng.lng, e.latlng.lat);
            if (gridRef) gridRef.innerText = `GRID: ${grid}`;
            
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
                circle: false, circlemarker: false, 
                marker: {
                    icon: L.divIcon({
                        className: 'tactical-marker',
                        html: '<div style="width:12px; height:12px; background:blue; border:2px solid white;"></div>'
                    })
                }
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
            
            if (layer instanceof L.Marker) {
                const iconHtml = `<div style="width:16px; height:16px; background:${selectedColor}; border:2px solid white; border-radius:2px;"></div>`;
                layer.setIcon(L.divIcon({ className: 'tactical-marker', html: iconHtml }));
            } else {
                layer.setStyle({ color: selectedColor });
            }

            const label = `[${layer.feature.properties.operator}] ${getSymbolLabel(selectedSymbol)}: ${layer.feature.properties.text}`;
            layer.bindTooltip(label, { permanent: true, direction: 'right', className: 'leaflet-tooltip-tactical' });
            drawnItems.addLayer(layer);
        });

        const select = document.getElementById('theatre-select');
        if (select) select.value = activeTheatre;

        loadDrawings();
        createGrid();
        if (document.getElementById('show-grid').checked) {
            gridLayer.addTo(map);
        }
        setMapStyle(mapStyle);

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
                    pointToLayer: (f, latlng) => {
                        const color = f.properties.color || "#0000ff";
                        const iconHtml = `<div style="width:16px; height:16px; background:${color}; border:2px solid white; border-radius:2px;"></div>`;
                        return L.marker(latlng, {
                            icon: L.divIcon({ className: 'tactical-marker', html: iconHtml })
                        });
                    },
                    onEachFeature: (f, l) => {
                        const operator = f.properties.operator || "ANON";
                        const label = `[${operator}] ${getSymbolLabel(f.properties.symbol)}: ${f.properties.text || ''}`;
                        l.bindTooltip(label, { permanent: true, direction: 'right', className: 'leaflet-tooltip-tactical' });
                        drawnItems.addLayer(l);
                    }
                });
            });
        } catch (err) {}
    }

    document.getElementById('save-drawings').addEventListener('click', async () => {
        const status = document.getElementById('upload-status');
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
    checkLiveSession();
    setInterval(loadDrawings, 15000);
    setInterval(checkLiveSession, 30000);
});
