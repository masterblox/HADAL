/**
 * Gulf Watch - Main Application
 * Real-time geopolitical intelligence platform
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    incidents: [],
    filteredIncidents: [],
    selectedIncident: null,
    currentSection: 'monitor',
    filters: {
        country: 'all',
        severity: 'all',
        type: 'all',
        time: '24h'
    },
    map: null,
    markers: [],
    airspaceLayer: null,
    financeData: null
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    console.log('🌊 Gulf Watch initializing...');
    
    // Load data
    await loadIncidents();
    await loadFinanceData();
    
    // Initialize UI
    initializeNavigation();
    initializeFilters();
    initializeMap();
    initializeRailModules();
    
    // Render initial state
    renderIncidents();
    updateLastUpdateTime();
    
    // Start auto-refresh
    setInterval(refreshData, 60000); // Every minute
    
    console.log('✅ Gulf Watch ready');
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadIncidents() {
    try {
        const response = await fetch('incidents.json?t=' + Date.now());
        const data = await response.json();
        
        state.incidents = data.incidents || [];
        applyFilters();
        
        console.log(`📊 Loaded ${state.incidents.length} incidents`);
    } catch (error) {
        console.error('❌ Failed to load incidents:', error);
        showError('Failed to load incident data');
    }
}

async function loadFinanceData() {
    try {
        const response = await fetch('prices.json?t=' + Date.now());
        const data = await response.json();
        state.financeData = data.prices || {}; // Extract prices object
        updateFinancePanel();
    } catch (error) {
        console.error('❌ Failed to load finance data:', error);
    }
}

async function refreshData() {
    await loadIncidents();
    updateLastUpdateTime();
    
    if (state.currentSection === 'map') {
        updateMapMarkers();
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function initializeNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show selected section
            sections.forEach(s => {
                s.style.display = s.dataset.section === section ? 'block' : 'none';
            });

            state.currentSection = section;

            // Section-specific initialization
            if (section === 'map') {
                setTimeout(() => {
                    if (state.map) state.map.invalidateSize();
                    updateMapMarkers();
                }, 100);
            } else if (section === 'missile-defense') {
                // Initialize missile defense dashboard
                initializeMissileDefense();
            } else if (section === 'analysis') {
                // Initialize analysis charts
                initializeAnalysis();
            } else if (section === 'prediction') {
                // Initialize prediction engine
                initializePrediction();
            } else if (section === 'reports') {
                // Initialize reports tab
                initializeReports();
            }
        });
    });
}

// ============================================================================
// MISSILE DEFENSE DASHBOARD
// ============================================================================

let missileDefenseInitialized = false;

function initializeMissileDefense() {
    if (!missileDefenseInitialized) {
        // Set up country selector
        const countrySelect = document.getElementById('missile-defense-country');
        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                updateMissileDefenseDashboard(e.target.value);
            });
        }
        missileDefenseInitialized = true;
    }

    // Initial update with current selection
    const countrySelect = document.getElementById('missile-defense-country');
    if (countrySelect) {
        updateMissileDefenseDashboard(countrySelect.value);
    }
}

function updateMissileDefenseDashboard(selectedCountry) {
    const stats = calculateMissileDefenseStats(selectedCountry);

    // Update title
    const titleEl = document.getElementById('missile-defense-title');
    if (titleEl) {
        const countryName = selectedCountry === 'all' ? 'REGIONAL' : getCountryDisplayName(selectedCountry).toUpperCase();
        titleEl.textContent = `${countryName} MISSILE DEFENSE`;
    }

    // Update main metrics
    updateMetric('metric-detected', stats.total.detected);
    updateMetric('metric-intercepted', stats.total.intercepted);
    updateMetric('metric-impacted', stats.total.impacted);

    // Update ballistic missiles
    updateMetric('ballistic-detected', stats.ballistic.detected);
    updateMetric('ballistic-intercepted', stats.ballistic.intercepted);

    // Update drones
    updateMetric('drone-detected', stats.drone.detected);
    updateMetric('drone-intercepted', stats.drone.intercepted);

    // Update 24h stats
    updateMetric('24h-detected', stats.last24h.detected);
    updateMetric('24h-intercepted', stats.last24h.intercepted);

    // Update success rate
    const successRate = calculateSuccessRate(stats.total.intercepted, stats.total.impacted);
    updateSuccessRate(successRate);

    // Update country table
    updateCountryTable(stats.countryBreakdown, selectedCountry);

    // Update source attribution
    updateMissileDefenseSource(selectedCountry);

    // Update last updated time
    const lastUpdatedEl = document.getElementById('missile-last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `Updated: ${new Date().toLocaleString()}`;
    }
}

function calculateMissileDefenseStats(selectedCountry) {
    const relevantTypes = ['missile', 'air_defense', 'drone', 'attack'];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
        total: { detected: 0, intercepted: 0, impacted: 0 },
        ballistic: { detected: 0, intercepted: 0 },
        drone: { detected: 0, intercepted: 0 },
        last24h: { detected: 0, intercepted: 0 },
        countryBreakdown: {}
    };

    // Initialize country breakdown
    const countries = ['uae', 'saudi', 'qatar', 'bahrain', 'kuwait', 'israel', 'iran'];
    countries.forEach(country => {
        stats.countryBreakdown[country] = {
            detected: 0,
            intercepted: 0,
            impacted: 0
        };
    });

    state.incidents.forEach(incident => {
        // Check if incident is relevant type
        const incidentType = (incident.type || '').toLowerCase();
        const isRelevantType = relevantTypes.includes(incidentType);

        // Check if it's a missile/drone related incident by title keywords
        const title = (incident.title || '').toLowerCase();
        const isMissileRelated = title.includes('missile') || title.includes('rocket') ||
                                 title.includes('ballistic') || title.includes('intercept') ||
                                 title.includes('air defense') || title.includes('shot down') ||
                                 title.includes('drone') || title.includes('uav');

        if (!isRelevantType && !isMissileRelated) return;

        // Determine country
        const countryCode = getCountryCode(incident.location?.country);
        if (countryCode === 'unknown') return;

        // Filter by selected country if not 'all'
        if (selectedCountry !== 'all' && countryCode !== selectedCountry) return;

        // Check if intercepted
        const isIntercepted = isIncidentIntercepted(incident);
        const isImpacted = !isIntercepted && (incidentType === 'missile' || incidentType === 'attack' ||
                          title.includes('impact') || title.includes('hit') || title.includes('strike'));

        // Update stats
        stats.total.detected++;
        if (isIntercepted) stats.total.intercepted++;
        if (isImpacted) stats.total.impacted++;

        // Update country breakdown
        if (stats.countryBreakdown[countryCode]) {
            stats.countryBreakdown[countryCode].detected++;
            if (isIntercepted) stats.countryBreakdown[countryCode].intercepted++;
            if (isImpacted) stats.countryBreakdown[countryCode].impacted++;
        }

        // Categorize by type
        if (incidentType === 'missile' || title.includes('missile') || title.includes('ballistic') || title.includes('rocket')) {
            stats.ballistic.detected++;
            if (isIntercepted) stats.ballistic.intercepted++;
        } else if (incidentType === 'drone' || title.includes('drone') || title.includes('uav')) {
            stats.drone.detected++;
            if (isIntercepted) stats.drone.intercepted++;
        }

        // Check if within last 24 hours
        const incidentDate = new Date(incident.published);
        if (incidentDate >= twentyFourHoursAgo) {
            stats.last24h.detected++;
            if (isIntercepted) stats.last24h.intercepted++;
        }
    });

    return stats;
}

function isIncidentIntercepted(incident) {
    const title = (incident.title || '').toLowerCase();
    const status = (incident.status || '').toLowerCase();
    const type = (incident.type || '').toLowerCase();

    // Check for interception keywords
    const interceptionKeywords = [
        'intercepted', 'shot down', 'downed', 'destroyed', 'neutralized',
        'air defense', 'patriot', 'thaad', 'iron dome', 'arrow',
        'successfully intercepted', 'defense system', 'intercept'
    ];

    // Check verification badge
    const verification = incident.verification || {};
    if (verification.badge === 'VERIFIED' && interceptionKeywords.some(kw => title.includes(kw))) {
        return true;
    }

    // Check title for interception keywords
    if (interceptionKeywords.some(kw => title.includes(kw))) {
        return true;
    }

    // Check if it's an air_defense type incident
    if (type === 'air_defense') {
        return true;
    }

    return false;
}

function calculateSuccessRate(intercepted, impacted) {
    const total = intercepted + impacted;
    if (total === 0) return 0;
    return Math.round((intercepted / total) * 100);
}

function updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function updateSuccessRate(percentage) {
    const circle = document.getElementById('success-rate-circle');
    const valueEl = document.getElementById('success-rate-value');

    if (circle) {
        const circumference = 100;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDasharray = `${percentage}, 100`;
    }

    if (valueEl) {
        valueEl.textContent = `${percentage}%`;
        // Color code based on success rate
        if (percentage >= 80) {
            valueEl.style.color = 'var(--severity-low)';
        } else if (percentage >= 50) {
            valueEl.style.color = 'var(--severity-medium)';
        } else {
            valueEl.style.color = 'var(--severity-critical)';
        }
    }
}

function updateCountryTable(breakdown, selectedCountry) {
    const tbody = document.getElementById('missile-country-tbody');
    if (!tbody) return;

    // If a specific country is selected, show detailed breakdown
    if (selectedCountry !== 'all') {
        const countryData = breakdown[selectedCountry];
        if (countryData) {
            const successRate = calculateSuccessRate(countryData.intercepted, countryData.impacted);
            tbody.innerHTML = `
                <tr>
                    <td>${getCountryDisplayName(selectedCountry)}</td>
                    <td class="value-detected">${countryData.detected}</td>
                    <td class="value-intercepted">${countryData.intercepted}</td>
                    <td class="value-impacted">${countryData.impacted}</td>
                    <td class="success-rate-${successRate >= 80 ? 'high' : successRate >= 50 ? 'medium' : 'low'}">${successRate}%</td>
                </tr>
            `;
        }
        return;
    }

    // Show all countries with data
    let html = '';
    const sortedCountries = Object.entries(breakdown)
        .filter(([_, data]) => data.detected > 0)
        .sort((a, b) => b[1].detected - a[1].detected);

    if (sortedCountries.length === 0) {
        html = '<tr><td colspan="5" class="no-data">No missile defense data available</td></tr>';
    } else {
        sortedCountries.forEach(([country, data]) => {
            const successRate = calculateSuccessRate(data.intercepted, data.impacted);
            html += `
                <tr>
                    <td>${getCountryDisplayName(country)}</td>
                    <td class="value-detected">${data.detected}</td>
                    <td class="value-intercepted">${data.intercepted}</td>
                    <td class="value-impacted">${data.impacted}</td>
                    <td class="success-rate-${successRate >= 80 ? 'high' : successRate >= 50 ? 'medium' : 'low'}">${successRate}%</td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
}

function getCountryDisplayName(countryCode) {
    const names = {
        'uae': '🇦🇪 United Arab Emirates',
        'saudi': '🇸🇦 Saudi Arabia',
        'qatar': '🇶🇦 Qatar',
        'bahrain': '🇧🇭 Bahrain',
        'kuwait': '🇰🇼 Kuwait',
        'oman': '🇴🇲 Oman',
        'israel': '🇮🇱 Israel',
        'iran': '🇮🇷 Iran'
    };
    return names[countryCode] || countryCode.toUpperCase();
}

function updateMissileDefenseSource(selectedCountry) {
    const sourceEl = document.getElementById('missile-defense-source');
    if (!sourceEl) return;

    const sources = {
        'uae': 'UAE Ministry of Interior & General Command of the Armed Forces',
        'saudi': 'Royal Saudi Air Defense Forces & Ministry of Defense',
        'qatar': 'Qatar Armed Forces & Ministry of Defense',
        'bahrain': 'Bahrain Defence Force & Ministry of Interior',
        'kuwait': 'Kuwait Armed Forces & Ministry of Defense',
        'israel': 'Israel Defense Forces (IDF) & Home Front Command',
        'iran': 'Islamic Republic News Agency (IRNA) & Military Sources',
        'all': 'Aggregated from Multiple Government & Defense Sources'
    };

    sourceEl.textContent = sources[selectedCountry] || sources['all'];
}

// ============================================================================
// FILTERS
// ============================================================================

function initializeFilters() {
    // Country filters
    document.querySelectorAll('#country-filters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            toggleFilterChip(chip, 'country');
        });
    });
    
    // Severity filters
    document.querySelectorAll('#severity-filters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            toggleFilterChip(chip, 'severity');
        });
    });
    
    // Type filters
    document.querySelectorAll('#type-filters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            toggleFilterChip(chip, 'type');
        });
    });
    
    // Time filters
    document.querySelectorAll('#time-filters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            toggleFilterChip(chip, 'time');
        });
    });
    
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            state.filters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }
}

function toggleFilterChip(chip, filterType) {
    const container = chip.parentElement;
    
    // For country/severity/type: allow multiple selections or 'all'
    if (filterType === 'country' || filterType === 'severity' || filterType === 'type') {
        const isAll = chip.dataset[filterType] === 'all';
        
        if (isAll) {
            // Clicking 'all' clears others
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.filters[filterType] = 'all';
        } else {
            // Remove 'all' selection
            const allChip = container.querySelector(`[data-${filterType}="all"]`);
            if (allChip) allChip.classList.remove('active');
            
            // Toggle this chip
            chip.classList.toggle('active');
            
            // Update state
            const activeChips = container.querySelectorAll('.filter-chip.active');
            const values = Array.from(activeChips).map(c => c.dataset[filterType]);
            state.filters[filterType] = values.length > 0 ? values : 'all';
        }
    } else {
        // For time: single select
        container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.filters[filterType] = chip.dataset[filterType];
    }
    
    applyFilters();
}

function applyFilters() {
    state.filteredIncidents = state.incidents.filter(incident => {
        // Country filter
        if (state.filters.country !== 'all') {
            const countries = Array.isArray(state.filters.country) 
                ? state.filters.country 
                : [state.filters.country];
            const incidentCountry = getCountryCode(incident.location?.country);
            if (!countries.includes(incidentCountry)) return false;
        }
        
        // Severity filter
        if (state.filters.severity !== 'all') {
            const severities = Array.isArray(state.filters.severity)
                ? state.filters.severity
                : [state.filters.severity];
            const incidentSeverity = getSeverityLevel(incident);
            if (!severities.includes(incidentSeverity)) return false;
        }
        
        // Type filter
        if (state.filters.type !== 'all') {
            const types = Array.isArray(state.filters.type)
                ? state.filters.type
                : [state.filters.type];
            const incidentType = incident.type?.toLowerCase() || 'unknown';
            if (!types.includes(incidentType)) return false;
        }
        
        // Time filter
        if (state.filters.time !== 'all') {
            const incidentDate = new Date(incident.published);
            const now = new Date();
            const hoursAgo = (now - incidentDate) / (1000 * 60 * 60);
            
            switch (state.filters.time) {
                case '24h':
                    if (hoursAgo > 24) return false;
                    break;
                case '7d':
                    if (hoursAgo > 168) return false;
                    break;
                case '30d':
                    if (hoursAgo > 720) return false;
                    break;
            }
        }
        
        // Search filter
        if (state.filters.search) {
            const searchText = state.filters.search;
            const title = incident.title?.toLowerCase() || '';
            const source = incident.source?.toLowerCase() || '';
            const country = incident.location?.country?.toLowerCase() || '';
            
            if (!title.includes(searchText) && 
                !source.includes(searchText) && 
                !country.includes(searchText)) {
                return false;
            }
        }
        
        return true;
    });
    
    renderIncidents();
    updateMapMarkers();
    updateCasualtyCounts();
    updateValidationStats();
}

function getCountryCode(country) {
    if (!country) return 'unknown';
    const map = {
        'uae': 'uae', 'united arab emirates': 'uae',
        'saudi': 'saudi', 'saudi arabia': 'saudi',
        'qatar': 'qatar',
        'bahrain': 'bahrain',
        'kuwait': 'kuwait',
        'oman': 'oman',
        'israel': 'israel',
        'iran': 'iran',
        'lebanon': 'lebanon'
    };
    return map[country.toLowerCase()] || 'unknown';
}

function getSeverityLevel(incident) {
    // Use verification badge or derive from keywords
    const title = incident.title?.toLowerCase() || '';
    
    if (incident.verification?.badge === 'CRITICAL') return 'critical';
    if (title.includes('killed') || title.includes('death') || title.includes('attack')) {
        return 'high';
    }
    if (title.includes('intercept') || title.includes('defense')) {
        return 'medium';
    }
    return 'low';
}

// ============================================================================
// INCIDENT RENDERING
// ============================================================================

function renderIncidents() {
    const container = document.getElementById('incident-feed');
    if (!container) return;
    
    if (state.filteredIncidents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No incidents found</div>
                <div class="empty-state-text">Try adjusting your filters or search criteria</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.filteredIncidents.map(incident => {
        const flag = getFlagEmoji(incident.location?.country);
        const severity = getSeverityLevel(incident);
        const timeAgo = getTimeAgo(incident.published);
        const verification = incident.verification || {};
        const badgeClass = verification.badge?.toLowerCase() || 'unconfirmed';
        const isGov = incident.is_government ? '✓' : '';
        
        const sourceUrl = incident.source_url || incident.url || '#';
        const hasCoords = incident.location?.lat && incident.location?.lng;
        
        return `
            <div class="incident-card" data-id="${incident.id}">
                <div class="incident-header">
                    <span class="incident-flag">${flag}</span>
                    <span class="incident-severity ${severity}"></span>
                    <span class="incident-time">${timeAgo}</span>
                    <span class="incident-type">${incident.type || 'INCIDENT'}</span>
                    <span class="verification-badge ${badgeClass}">${verification.badge || 'UNCONFIRMED'}</span>
                    ${isGov ? `<span class="incident-gov">${isGov}</span>` : ''}
                </div>
                <div class="incident-title line-clamp-2">${escapeHtml(incident.title)}</div>
                <div class="incident-coords">
                    ${hasCoords ? `📍 ${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}` : '📍 No coordinates'}
                </div>
                <div class="incident-source">
                    ${incident.source || 'Unknown'} 
                    ${incident.num_sources ? `+ ${incident.num_sources - 1} sources` : ''}
                </div>
                <div class="incident-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); window.open('${escapeHtml(sourceUrl)}', '_blank')" title="View Source">
                        🔗 Source
                    </button>
                    <a class="action-btn" href="https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(incident.title)}&op=translate" target="_blank" rel="noopener" title="Translate">
                        🌐 Translate
                    </a>
                    <button class="action-btn report-btn" onclick="event.stopPropagation(); openReportModal(${incident.id})" title="Report False Claim">
                        🚩 Report
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function selectIncident(id) {
    const card = document.querySelector(`.incident-card[data-id="${id}"]`);
    if (!card) return;
    
    // Toggle expanded state
    const isExpanded = card.classList.contains('expanded');
    
    // Collapse all others
    document.querySelectorAll('.incident-card').forEach(c => c.classList.remove('expanded', 'active'));
    
    if (!isExpanded) {
        card.classList.add('expanded', 'active');
        state.selectedIncident = state.incidents.find(i => i.id === id);
        
        // Center map on incident
        if (state.map && state.selectedIncident?.location) {
            const { lat, lng } = state.selectedIncident.location;
            state.map.setView([lat, lng], 8);
        }
    } else {
        state.selectedIncident = null;
    }
}

function getFlagEmoji(country) {
    const flags = {
        'uae': '🇦🇪', 'united arab emirates': '🇦🇪',
        'saudi': '🇸🇦', 'saudi arabia': '🇸🇦',
        'qatar': '🇶🇦',
        'bahrain': '🇧🇭',
        'kuwait': '🇰🇼',
        'oman': '🇴🇲',
        'israel': '🇮🇱',
        'iran': '🇮🇷',
        'lebanon': '🇱🇧'
    };
    return flags[country?.toLowerCase()] || '🌍';
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// MAP
// ============================================================================

// ============================================================================
// CESIUMJS 3D GLOBE WITH HEAT MAP
// ============================================================================

let cesiumViewer = null;
let heatMapPrimitive = null;
let aircraftEntities = null;
let satelliteEntities = null;
let maritimeEntities = null;
let visualMode = 'normal';

// Heat map color gradient
const heatMapGradient = {
    0.0: 'rgba(0, 255, 0, 0.3)',    // Low - Green
    0.25: 'rgba(255, 255, 0, 0.5)', // Medium-Low - Yellow
    0.5: 'rgba(255, 165, 0, 0.7)',  // Medium - Orange
    0.75: 'rgba(255, 69, 0, 0.8)',  // High - Red-Orange
    1.0: 'rgba(255, 0, 0, 0.9)'     // Critical - Red
};

function initializeMap() {
    const container = document.getElementById('cesiumContainer');
    if (!container) {
        console.error('Cesium container not found');
        return;
    }
    
    // Check if Cesium is loaded
    if (typeof Cesium === 'undefined') {
        console.error('CesiumJS not loaded');
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Map loading failed. Please refresh.</div>';
        return;
    }
    
    try {
        // Initialize Cesium viewer with minimal config
        cesiumViewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: Cesium.createWorldTerrain(),
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            shouldAnimate: false,
            imageryProvider: new Cesium.TileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            })
        });
        
        // Dark theme styling
        cesiumViewer.scene.globe.baseColor = Cesium.Color.BLACK;
        cesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;
        cesiumViewer.scene.globe.enableLighting = false;
        
        // Set initial view over Middle East
        cesiumViewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(34.0, 12.0, 60.0, 35.0),
            duration: 0
        });
        
        // Layer toggles
        document.querySelectorAll('.layer-toggle input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const layer = e.target.dataset.layer;
                const isActive = e.target.checked;
                
                switch(layer) {
                    case 'events':
                        toggleIncidentLayer(isActive);
                        break;
                    case 'heatmap':
                        toggleHeatMap(isActive);
                        break;
                    case 'aircraft':
                        toggleAircraftLayer(isActive);
                        break;
                    case 'satellites':
                        toggleSatelliteLayer(isActive);
                        break;
                    case 'maritime':
                        toggleMaritimeLayer(isActive);
                        break;
                    case 'airspace':
                        toggleAirspaceLayer(isActive);
                        break;
                }
                
                e.target.parentElement.classList.toggle('active', isActive);
            });
        });
        
        // Visual mode controls
        document.querySelectorAll('.visual-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                setVisualMode(mode);
                
                document.querySelectorAll('.visual-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Initialize layers
        updateCesiumMap();
        createHeatMap();
        
        console.log('✅ Cesium map initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Cesium:', error);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Map unavailable. Using data view.</div>';
    }
}

function updateCesiumMap() {
    if (!cesiumViewer) return;
    
    try {
        // Clear existing entities
        cesiumViewer.entities.removeAll();
        
        // Add incident markers
        state.filteredIncidents.forEach(incident => {
            if (!incident.location?.lat || !incident.location?.lng) return;
            
            const severity = getSeverityLevel(incident);
            const color = getSeverityColorCesium(severity);
            
            // Simple marker
            cesiumViewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    incident.location.lng,
                    incident.location.lat,
                    10000
                ),
                name: incident.title?.substring(0, 60) || 'Incident',
                description: incident.title || '',
                point: {
                    pixelSize: 12,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2
                }
            });
        });
        
        console.log(`✅ Added ${state.filteredIncidents.length} incidents to map`);
        
    } catch (error) {
        console.error('❌ Error updating map:', error);
    }
}

function createHeatMap() {
    if (!cesiumViewer) return;
    
    try {
        // Simple heat map using circles
        const locationGroups = {};
        
        state.filteredIncidents.forEach(incident => {
            if (!incident.location?.lat || !incident.location?.lng) return;
            
            const key = `${incident.location.lat.toFixed(1)},${incident.location.lng.toFixed(1)}`;
            if (!locationGroups[key]) {
                locationGroups[key] = {
                    lat: incident.location.lat,
                    lng: incident.location.lng,
                    count: 0
                };
            }
            locationGroups[key].count++;
        });
        
        // Add heat circles
        Object.values(locationGroups).forEach(group => {
            const intensity = Math.min(group.count / 3, 1.0);
            const color = getHeatColor(intensity);
            
            cesiumViewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(group.lng, group.lat, 5000),
                ellipse: {
                    semiMinorAxis: 50000 * intensity + 20000,
                    semiMajorAxis: 50000 * intensity + 20000,
                    material: color.withAlpha(0.3),
                    outline: false
                }
            });
        });
        
        console.log(`✅ Created heat map with ${Object.keys(locationGroups).length} zones`);
        
    } catch (error) {
        console.error('❌ Error creating heat map:', error);
    }
}

function updateHeatMap() {
    // Remove existing heat map
    if (heatMapPrimitive) {
        cesiumViewer.scene.primitives.remove(heatMapPrimitive);
        heatMapPrimitive = null;
    }
    
    // Recreate with current data
    createHeatMap();
}

function getHeatColor(intensity) {
    // Green (low) to Red (high)
    if (intensity < 0.25) {
        return new Cesium.Color(0, 1, 0, 0.3); // Green
    } else if (intensity < 0.5) {
        return new Cesium.Color(1, 1, 0, 0.5); // Yellow
    } else if (intensity < 0.75) {
        return new Cesium.Color(1, 0.65, 0, 0.7); // Orange
    } else {
        return new Cesium.Color(1, 0, 0, 0.9); // Red
    }
}

function getSeverityScore(incident) {
    const severity = getSeverityLevel(incident);
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[severity] || 1;
}

function getSeverityColorCesium(severity) {
    const colors = {
        critical: Cesium.Color.RED,
        high: Cesium.Color.ORANGE,
        medium: Cesium.Color.YELLOW,
        low: Cesium.Color.GREEN
    };
    return colors[severity] || Cesium.Color.GRAY;
}

function getSeverityHeight(severity) {
    const heights = {
        critical: 50000,
        high: 30000,
        medium: 15000,
        low: 5000
    };
    return heights[severity] || 5000;
}

function createIncidentDescription(incident) {
    return `
        <div style="font-family: Inter, sans-serif; padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px;">${escapeHtml(incident.title || 'Untitled')}</h3>
            <p style="margin: 5px 0; font-size: 12px; color: #888;">
                ${getFlagEmoji(incident.location?.country)} ${incident.location?.country || 'Unknown'}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #888;">
                Source: ${incident.source || 'Unknown'}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #888;">
                Time: ${getTimeAgo(incident.published)}
            </p>
            <p style="margin: 5px 0; font-size: 12px;">
                Severity: <span style="color: ${getSeverityColor(getSeverityLevel(incident))};">${getSeverityLevel(incident).toUpperCase()}</span>
            </p>
        </div>
    `;
}

// Layer toggles
function toggleIncidentLayer(show) {
    cesiumViewer.entities.show = show;
}

function toggleHeatMap(show) {
    if (heatMapPrimitive) {
        heatMapPrimitive.show = show;
    } else if (show) {
        createHeatMap();
    }
}

function toggleAircraftLayer(show) {
    if (!aircraftEntities && show) {
        fetchAircraftData();
    } else if (aircraftEntities) {
        aircraftEntities.show = show;
    }
}

function toggleSatelliteLayer(show) {
    if (!satelliteEntities && show) {
        fetchSatelliteData();
    } else if (satelliteEntities) {
        satelliteEntities.show = show;
    }
}

function toggleMaritimeLayer(show) {
    if (!maritimeEntities && show) {
        fetchMaritimeData();
    } else if (maritimeEntities) {
        maritimeEntities.show = show;
    }
}

function toggleAirspaceLayer(show) {
    // Airspace visualization using entity polygons
    // Implementation depends on airspace data format
}

// Visual modes
function setVisualMode(mode) {
    visualMode = mode;
    const container = document.getElementById('cesiumContainer');
    
    // Remove all mode classes
    container.classList.remove('crt-mode', 'nvg-mode', 'flir-mode');
    
    // Add selected mode
    if (mode !== 'normal') {
        container.classList.add(`${mode}-mode`);
    }
    
    // Adjust Cesium scene based on mode
    if (cesiumViewer) {
        switch(mode) {
            case 'nvg':
                cesiumViewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1a0a');
                break;
            case 'flir':
                cesiumViewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a0a0a');
                break;
            default:
                cesiumViewer.scene.globe.baseColor = Cesium.Color.BLACK;
        }
    }
}

// Real-time data fetching
function startRealTimeUpdates() {
    // Fetch aircraft data every 10 seconds
    setInterval(() => {
        if (document.getElementById('layer-aircraft')?.checked) {
            fetchAircraftData();
        }
    }, 10000);
    
    // Fetch satellite data every 60 seconds
    setInterval(() => {
        if (document.getElementById('layer-satellites')?.checked) {
            fetchSatelliteData();
        }
    }, 60000);
    
    // Fetch maritime data every 30 seconds
    setInterval(() => {
        if (document.getElementById('layer-maritime')?.checked) {
            fetchMaritimeData();
        }
    }, 30000);
}

async function fetchAircraftData() {
    try {
        // OpenSky API for Gulf region
        const response = await fetch(
            'https://opensky-network.org/api/states/all?lamin=12.0&lamax=35.0&lomin=34.0&lomax=60.0'
        );
        const data = await response.json();
        
        if (!aircraftEntities) {
            aircraftEntities = cesiumViewer.entities.add(new Cesium.EntityCollection());
        } else {
            aircraftEntities.removeAll();
        }
        
        data.states?.forEach(state => {
            const [icao24, callsign, origin, time, lon, lat, alt] = state;
            if (lat && lon) {
                aircraftEntities.add({
                    position: Cesium.Cartesian3.fromDegrees(lon, lat, (alt || 0) * 0.3048),
                    name: callsign || icao24,
                    point: {
                        pixelSize: 8,
                        color: Cesium.Color.CYAN,
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 1
                    },
                    label: {
                        text: callsign || icao24,
                        font: '10px sans-serif',
                        fillColor: Cesium.Color.CYAN,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        show: false
                    }
                });
            }
        });
    } catch (error) {
        console.error('Failed to fetch aircraft data:', error);
    }
}

async function fetchSatelliteData() {
    // CelesTrak TLE data would be fetched here
    // For now, show sample satellites
    if (!satelliteEntities) {
        satelliteEntities = cesiumViewer.entities.add(new Cesium.EntityCollection());
    }
    
    // Sample satellites - replace with real TLE data
    const satellites = [
        { name: 'ISS', lat: 25.0, lon: 51.0, height: 408000 },
        { name: 'Hubble', lat: 28.0, lon: 55.0, height: 540000 }
    ];
    
    satellites.forEach(sat => {
        satelliteEntities.add({
            position: Cesium.Cartesian3.fromDegrees(sat.lon, sat.lat, sat.height),
            name: sat.name,
            point: {
                pixelSize: 10,
                color: Cesium.Color.GOLD,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: sat.name,
                font: '11px sans-serif',
                fillColor: Cesium.Color.GOLD,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -15)
            }
        });
    });
}

async function fetchMaritimeData() {
    // AIS data would be fetched here
    // Placeholder implementation
    if (!maritimeEntities) {
        maritimeEntities = cesiumViewer.entities.add(new Cesium.EntityCollection());
    }
}

function getSeverityColor(severity) {
    const colors = {
        critical: '#ff4444',
        high: '#ff8800',
        medium: '#ffcc00',
        low: '#44ff88'
    };
    return colors[severity] || '#888';
}

function toggleAirspaceLayer(show) {
    // Placeholder for airspace layer toggle
}
        // Load airspace data
        fetch('airspace.json')
            .then(r => r.json())
            .then(data => {
                state.airspaceLayer = L.layerGroup().addTo(state.map);
                
                (data.notams || []).forEach(notam => {
                    if (notam.coordinates) {
                        const circle = L.circle(notam.coordinates, {
                            radius: notam.radius || 50000,
                            fillColor: getNotamColor(notam.severity),
                            color: getNotamColor(notam.severity),
                            weight: 1,
                            fillOpacity: 0.2
                        }).addTo(state.airspaceLayer);
                        
                        circle.bindPopup(`
                            <strong>${notam.type}</strong><br>
                            ${notam.description}<br>
                            <small>${notam.effective}</small>
                        `);
                    }
                });
            });
    } else if (!show && state.airspaceLayer) {
        state.map.removeLayer(state.airspaceLayer);
        state.airspaceLayer = null;
    }
}

function getNotamColor(severity) {
    const colors = {
        critical: '#ff4444',
        warning: '#ff8800',
        elevated: '#ffcc00',
        information: '#00d4ff'
    };
    return colors[severity?.toLowerCase()] || '#888';
}

// ============================================================================
// RIGHT RAIL MODULES
// ============================================================================

function initializeRailModules() {
    // Collapsible modules
    document.querySelectorAll('.rail-header').forEach(header => {
        header.addEventListener('click', () => {
            const module = header.parentElement;
            module.classList.toggle('collapsed');
        });
    });
}

function updateFinancePanel() {
    if (!state.financeData) return;
    
    const updatePrice = (id, price, change) => {
        const priceEl = document.getElementById(`${id}-price`);
        const changeEl = document.getElementById(`${id}-change`);
        
        if (priceEl) priceEl.textContent = price;
        if (changeEl) {
            changeEl.textContent = change;
            changeEl.className = `finance-change ${change?.startsWith('+') ? 'positive' : 'negative'}`;
        }
    };
    
    updatePrice('brent', state.financeData.brent?.formatted_price, state.financeData.brent?.formatted_change);
    updatePrice('gold', state.financeData.gold?.formatted_price, state.financeData.gold?.formatted_change);
    updatePrice('bitcoin', state.financeData.bitcoin?.formatted_price, state.financeData.bitcoin?.formatted_change);
    updatePrice('gas', state.financeData.gas?.formatted_price, state.financeData.gas?.formatted_change);
    updatePrice('copper', state.financeData.copper?.formatted_price, state.financeData.copper?.formatted_change);
    updatePrice('iron', state.financeData.iron?.formatted_price, state.financeData.iron?.formatted_change);
}

function updateCasualtyCounts() {
    let total = 0, military = 0, civilian = 0, injured = 0;
    
    state.filteredIncidents.forEach(inc => {
        const casualties = inc.casualties || {};
        total += casualties.total || 0;
        military += casualties.military || 0;
        civilian += casualties.civilian || 0;
        injured += casualties.injured || 0;
    });
    
    const updateEl = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '0';
    };
    
    updateEl('total-casualties', total);
    updateEl('military-casualties', military);
    updateEl('civilian-casualties', civilian);
    updateEl('injured-count', injured);
}

function updateValidationStats() {
    const stats = {
        validated: 0,
        pending: 0,
        disputed: 0
    };
    
    state.filteredIncidents.forEach(inc => {
        const badge = inc.verification?.badge;
        if (badge === 'VERIFIED') stats.validated++;
        else if (badge === 'PARTIAL' || badge === 'UNCONFIRMED') stats.pending++;
        else if (badge === 'DISPUTED') stats.disputed++;
    });
    
    const updateEl = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateEl('validated-count', stats.validated);
    updateEl('pending-count', stats.pending);
    updateEl('disputed-count', stats.disputed);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function updateLastUpdateTime() {
    const el = document.getElementById('last-update');
    if (el) {
        const now = new Date();
        el.textContent = `Updated ${now.toLocaleTimeString()}`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    console.error(message);
    // Could show toast notification here
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

function downloadJSON() {
    downloadData(state.filteredIncidents, 'gulfwatch-incidents.json');
}

function downloadCSV() {
    const headers = ['ID', 'Title', 'Source', 'Country', 'Published', 'Type', 'Severity'];
    const rows = state.filteredIncidents.map(inc => [
        inc.id,
        `"${(inc.title || '').replace(/"/g, '""')}"`,
        inc.source,
        inc.location?.country,
        inc.published,
        inc.type,
        getSeverityLevel(inc)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadBlob(csv, 'gulfwatch-incidents.csv', 'text/csv');
}

function downloadGeoJSON() {
    const features = state.filteredIncidents
        .filter(inc => inc.location?.lat && inc.location?.lng)
        .map(inc => ({
            type: 'Feature',
            properties: {
                id: inc.id,
                title: inc.title,
                source: inc.source,
                type: inc.type,
                published: inc.published
            },
            geometry: {
                type: 'Point',
                coordinates: [inc.location.lng, inc.location.lat]
            }
        }));
    
    const geojson = {
        type: 'FeatureCollection',
        features: features
    };
    
    downloadData(geojson, 'gulfwatch-incidents.geojson');
}

function downloadData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, filename, 'application/json');
}

function downloadBlob(data, filename, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make functions globally available for onclick handlers
window.selectIncident = selectIncident;
window.downloadJSON = downloadJSON;
window.downloadCSV = downloadCSV;
window.downloadGeoJSON = downloadGeoJSON;

// Translate incident - opens Google Translate
function translateIncident(incidentId) {
    const incident = state.incidents.find(i => i.id === incidentId);
    if (!incident || !incident.title) return;
    
    const encodedText = encodeURIComponent(incident.title);
    window.open(`https://translate.google.com/?sl=auto&tl=en&text=${encodedText}&op=translate`, '_blank');
}

window.translateIncident = translateIncident;

// ============================================================================
// REPORT FALSE CLAIM MODAL
// ============================================================================

function openReportModal(incidentId) {
    const modal = document.getElementById('report-modal');
    const incidentIdInput = document.getElementById('report-incident-id');
    if (modal && incidentIdInput) {
        incidentIdInput.value = incidentId;
        modal.classList.add('active');
    }
}

function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    // Reset form
    const form = document.getElementById('report-form');
    if (form) form.reset();
}

// Handle report form submission
document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const incidentId = document.getElementById('report-incident-id').value;
            const reason = document.getElementById('report-reason').value;
            const details = document.getElementById('report-details').value;
            
            // Store report in localStorage (since we don't have a backend)
            const reports = JSON.parse(localStorage.getItem('gulfwatch_reports') || '[]');
            reports.push({
                incidentId,
                reason,
                details,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('gulfwatch_reports', JSON.stringify(reports));
            
            alert('Thank you for your report. We will review it shortly.');
            closeReportModal();
        });
    }
});

// ============================================================================
// TRANSLATION MODAL
// ============================================================================

function openTranslateModal(title) {
    const modal = document.getElementById('translate-modal');
    const originalText = document.getElementById('translate-original');
    const resultDiv = document.getElementById('translate-result');
    const translateLink = document.getElementById('translate-link');

    if (modal && originalText) {
        originalText.textContent = title;

        // Create Google Translate link
        const encodedText = encodeURIComponent(title);
        translateLink.href = `https://translate.google.com/?sl=auto&tl=en&text=${encodedText}&op=translate`;

        // Show modal
        modal.classList.add('active');

        // Try LibreTranslate API for instant translation
        resultDiv.innerHTML = '<div class="translate-loading">Translating...</div>';

        // Use LibreTranslate public instance
        fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: title,
                source: 'auto',
                target: 'en',
                format: 'text'
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Translation failed');
            return response.json();
        })
        .then(data => {
            if (data.translatedText) {
                resultDiv.innerHTML = `<p>${escapeHtml(data.translatedText)}</p>`;
            } else {
                throw new Error('No translation returned');
            }
        })
        .catch(error => {
            // Fallback to Google Translate link
            resultDiv.innerHTML = `
                <p style="color: var(--text-secondary); margin-bottom: 12px;">
                    Automatic translation unavailable. Click "Open in Google Translate" to translate.
                </p>
            `;
        });
    }
}

function closeTranslateModal() {
    const modal = document.getElementById('translate-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Helper function to detect Arabic text
function containsArabic(text) {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
}

// ============================================================================
// ANALYSIS CHARTS
// ============================================================================

let analysisInitialized = false;

function initializeAnalysis() {
    if (!analysisInitialized) {
        analysisInitialized = true;
    }
    renderAnalysisCharts();
}

function renderAnalysisCharts() {
    renderTimelineChart();
    renderHeatmapChart();
    renderFinanceChart();
    renderCasualtyChart();
    renderReliabilityChart();
    renderIntensityChart();
}

function renderTimelineChart() {
    const container = document.getElementById('timeline-chart');
    if (!container) return;

    // Group incidents by date
    const incidentsByDate = {};
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    state.incidents.forEach(incident => {
        const date = new Date(incident.timestamp);
        if (date >= last30Days) {
            const dateKey = date.toISOString().split('T')[0];
            incidentsByDate[dateKey] = (incidentsByDate[dateKey] || 0) + 1;
        }
    });

    // Sort dates and get last 14 days with data
    const sortedDates = Object.keys(incidentsByDate).sort().slice(-14);
    const maxCount = Math.max(...Object.values(incidentsByDate), 1);

    if (sortedDates.length === 0) {
        container.innerHTML = '<div class="chart-empty">No data available</div>';
        return;
    }

    // Build simple bar chart with CSS
    let html = '<div class="chart-timeline">';
    sortedDates.forEach(date => {
        const count = incidentsByDate[date];
        const height = (count / maxCount) * 100;
        const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        html += `
            <div class="timeline-bar-wrapper">
                <div class="timeline-bar" style="height: ${height}%" title="${count} incidents on ${label}"></div>
                <div class="timeline-label">${label}</div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderHeatmapChart() {
    const container = document.getElementById('heatmap-chart');
    if (!container) return;

    // Count incidents by country
    const countryCounts = {};
    state.incidents.forEach(incident => {
        const country = incident.country || 'unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const sortedCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    if (sortedCountries.length === 0) {
        container.innerHTML = '<div class="chart-empty">No data available</div>';
        return;
    }

    const maxCount = Math.max(...sortedCountries.map(([_, count]) => count));

    let html = '<div class="chart-heatmap">';
    sortedCountries.forEach(([country, count]) => {
        const intensity = count / maxCount;
        const color = intensity > 0.7 ? 'var(--severity-critical)' :
                      intensity > 0.4 ? 'var(--severity-high)' :
                      intensity > 0.2 ? 'var(--severity-medium)' : 'var(--severity-low)';
        html += `
            <div class="heatmap-row">
                <span class="heatmap-country">${getCountryDisplayName(country)}</span>
                <div class="heatmap-bar-wrapper">
                    <div class="heatmap-bar" style="width: ${intensity * 100}%; background: ${color}"></div>
                </div>
                <span class="heatmap-count">${count}</span>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderFinanceChart() {
    const container = document.getElementById('finance-chart');
    if (!container) return;

    const prices = state.financeData || {};

    const commodities = [
        { key: 'brent', name: 'Brent Crude', icon: '🛢️' },
        { key: 'gold', name: 'Gold', icon: '🥇' },
        { key: 'bitcoin', name: 'Bitcoin', icon: '₿' },
        { key: 'gas', name: 'Natural Gas', icon: '🔥' }
    ];

    let html = '<div class="chart-finance">';
    commodities.forEach(({ key, name, icon }) => {
        const data = prices[key];
        if (data) {
            const changeClass = data.change >= 0 ? 'positive' : 'negative';
            const changeSymbol = data.change >= 0 ? '+' : '';
            html += `
                <div class="finance-metric">
                    <span class="finance-metric-icon">${icon}</span>
                    <div class="finance-metric-info">
                        <span class="finance-metric-name">${name}</span>
                        <span class="finance-metric-price">$${data.price?.toLocaleString() || '--'}</span>
                    </div>
                    <span class="finance-metric-change ${changeClass}">${changeSymbol}${data.change?.toFixed(2) || '--'}%</span>
                </div>
            `;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderCasualtyChart() {
    const container = document.getElementById('casualty-chart');
    if (!container) return;

    let total = 0, military = 0, civilian = 0, injured = 0;

    state.incidents.forEach(incident => {
        const casualties = incident.casualties || {};
        if (casualties.deaths) {
            total += casualties.deaths;
            if (casualties.type === 'military') military += casualties.deaths;
            else if (casualties.type === 'civilian') civilian += casualties.deaths;
        }
        if (casualties.injured) injured += casualties.injured;
    });

    if (total === 0 && injured === 0) {
        container.innerHTML = '<div class="chart-empty">No casualty data available</div>';
        return;
    }

    container.innerHTML = `
        <div class="casualty-chart-grid">
            <div class="casualty-chart-item">
                <div class="casualty-chart-value critical">${total}</div>
                <div class="casualty-chart-label">Total Deaths</div>
            </div>
            <div class="casualty-chart-item">
                <div class="casualty-chart-value">${military}</div>
                <div class="casualty-chart-label">Military</div>
            </div>
            <div class="casualty-chart-item">
                <div class="casualty-chart-value">${civilian}</div>
                <div class="casualty-chart-label">Civilian</div>
            </div>
            <div class="casualty-chart-item">
                <div class="casualty-chart-value">${injured}</div>
                <div class="casualty-chart-label">Injured</div>
            </div>
        </div>
    `;
}

function renderReliabilityChart() {
    const container = document.getElementById('reliability-chart');
    if (!container) return;

    const sourceStats = {
        'Government': { count: 0, score: 95 },
        'News Agency': { count: 0, score: 75 },
        'Social Media': { count: 0, score: 45 },
        'Other': { count: 0, score: 60 }
    };

    state.incidents.forEach(incident => {
        const source = incident.source || 'Other';
        if (source.includes('gov') || source.includes('official')) {
            sourceStats['Government'].count++;
        } else if (source.includes('news') || source.includes('reuters') || source.includes('ap')) {
            sourceStats['News Agency'].count++;
        } else if (source.includes('social') || source.includes('twitter') || source.includes('x')) {
            sourceStats['Social Media'].count++;
        } else {
            sourceStats['Other'].count++;
        }
    });

    let html = '<div class="chart-reliability">';
    Object.entries(sourceStats).forEach(([source, data]) => {
        if (data.count > 0) {
            const reliabilityClass = data.score >= 80 ? 'high' : data.score >= 60 ? 'medium' : 'low';
            html += `
                <div class="reliability-row">
                    <div class="reliability-info">
                        <span class="reliability-source">${source}</span>
                        <span class="reliability-count">${data.count} incidents</span>
                    </div>
                    <div class="reliability-score-wrapper">
                        <div class="reliability-bar-bg">
                            <div class="reliability-bar ${reliabilityClass}" style="width: ${data.score}%"></div>
                        </div>
                        <span class="reliability-score">${data.score}%</span>
                    </div>
                </div>
            `;
        }
    });
    html += '</div>';
    container.innerHTML = html || '<div class="chart-empty">No source data available</div>';
}

function renderIntensityChart() {
    const container = document.getElementById('intensity-chart');
    if (!container) return;

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    state.incidents.forEach(incident => {
        const severity = incident.severity || 'low';
        if (severityCounts[severity] !== undefined) {
            severityCounts[severity]++;
        }
    });

    const total = Object.values(severityCounts).reduce((a, b) => a + b, 0);

    if (total === 0) {
        container.innerHTML = '<div class="chart-empty">No intensity data available</div>';
        return;
    }

    // Calculate intensity score (weighted average)
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    const weightedSum = Object.entries(severityCounts).reduce((sum, [sev, count]) => sum + (weights[sev] * count), 0);
    const intensityScore = Math.round((weightedSum / (total * 4)) * 100);

    let html = '<div class="chart-intensity">';

    // Intensity meter
    html += `
        <div class="intensity-main">
            <div class="intensity-value ${intensityScore > 70 ? 'critical' : intensityScore > 40 ? 'high' : 'medium'}">${intensityScore}%</div>
            <div class="intensity-label">Conflict Intensity Index</div>
        </div>
    `;

    // Breakdown by severity
    html += '<div class="intensity-breakdown">';
    Object.entries(severityCounts).forEach(([severity, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        html += `
            <div class="intensity-item">
                <span class="intensity-dot ${severity}"></span>
                <span class="intensity-severity">${severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
                <span class="intensity-percentage">${percentage}%</span>
            </div>
        `;
    });
    html += '</div></div>';

    container.innerHTML = html;
}

// ============================================================================
// PREDICTION ENGINE
// ============================================================================

let predictor = null;
let predictionInitialized = false;

function initializePrediction() {
    if (!predictionInitialized) {
        // Initialize predictor with current incidents
        predictor = new GulfPredictor(state.incidents);
        
        // Populate dropdowns
        populatePredictionDropdowns();
        
        // Set up event listeners
        setupPredictionListeners();
        
        predictionInitialized = true;
    }
}

function populatePredictionDropdowns() {
    if (!predictor) return;
    
    // Populate actors
    const actorSelect = document.getElementById('predict-actor');
    if (actorSelect) {
        const actors = predictor.getActors();
        actors.forEach(actor => {
            const option = document.createElement('option');
            option.value = actor.id;
            option.textContent = actor.name;
            actorSelect.appendChild(option);
        });
    }
    
    // Populate actions
    const actionSelect = document.getElementById('predict-action');
    if (actionSelect) {
        const actions = predictor.getActions();
        actions.forEach(action => {
            const option = document.createElement('option');
            option.value = action.id;
            option.textContent = action.name;
            actionSelect.appendChild(option);
        });
    }
    
    // Populate targets
    const targetSelect = document.getElementById('predict-target');
    if (targetSelect) {
        const targets = predictor.getTargets();
        targets.forEach(target => {
            const option = document.createElement('option');
            option.value = target.id;
            option.textContent = target.name;
            targetSelect.appendChild(option);
        });
    }
    
    // Populate countries
    const countrySelect = document.getElementById('predict-country');
    if (countrySelect) {
        const countries = predictor.getCountries();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });
    }
}

function setupPredictionListeners() {
    const runBtn = document.getElementById('run-prediction');
    if (runBtn) {
        runBtn.addEventListener('click', runPrediction);
    }
}

function runPrediction() {
    const actor = document.getElementById('predict-actor')?.value;
    const action = document.getElementById('predict-action')?.value;
    const target = document.getElementById('predict-target')?.value;
    const country = document.getElementById('predict-country')?.value;
    
    if (!actor || !action) {
        showError('Please select at least an actor and action');
        return;
    }
    
    // Run prediction
    const scenario = { actor, action, target, country };
    const predictions = predictor.predict(scenario);
    
    // Display results
    displayPredictions(predictions, scenario);
}

function displayPredictions(predictions, scenario) {
    const resultsContainer = document.getElementById('prediction-results');
    const emptyState = document.getElementById('prediction-empty');
    const grid = document.getElementById('predictions-grid');
    const context = document.getElementById('prediction-context');
    
    if (!resultsContainer || !grid) return;
    
    // Hide empty state, show results
    if (emptyState) emptyState.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    // Update context
    if (context) {
        const actorName = predictor.getActors().find(a => a.id === scenario.actor)?.name || scenario.actor;
        const actionName = predictor.getActions().find(a => a.id === scenario.action)?.name || scenario.action;
        context.textContent = `${actorName} → ${actionName}${scenario.target ? ' → ' + predictor.getTargets().find(t => t.id === scenario.target)?.name : ''}`;
    }
    
    // Build predictions grid
    let html = '';
    predictions.forEach((pred, index) => {
        const probabilityClass = pred.probability >= 70 ? 'high' : pred.probability >= 40 ? 'medium' : 'low';
        const icon = getPredictionIcon(pred.category);
        
        html += `
            <div class="prediction-card ${probabilityClass}" style="animation-delay: ${index * 0.1}s">
                <div class="prediction-card-header">
                    <span class="prediction-icon">${icon}</span>
                    <span class="prediction-category">${pred.category}</span>
                </div>
                <div class="prediction-outcome">${pred.outcome}</div>
                <div class="prediction-meta">
                    <div class="prediction-probability">
                        <div class="probability-bar">
                            <div class="probability-fill ${probabilityClass}" style="width: ${pred.probability}%"></div>
                        </div>
                        <span class="probability-value">${pred.probability}%</span>
                    </div>
                    <div class="prediction-timeframe">${pred.timeframe}</div>
                </div>
                <div class="prediction-confidence">${pred.confidence}</div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function getPredictionIcon(category) {
    const icons = {
        'Military Response': '⚔️',
        'Regional Response': '🌍',
        'Market Impact': '📈',
        'Diplomatic Response': '🤝',
        'Follow-up Event': '➡️',
        'Maritime Security': '⚓',
        'Shipping Impact': '🚢',
        'Escalation Risk': '⚠️',
        'Defense Posture': '🛡️',
        'Monitoring': '👁️'
    };
    return icons[category] || '🔮';
}

// ============================================================================
// REPORTS TAB
// ============================================================================

function initializeReports() {
    loadIncomingReports();
    loadVerificationStats();
}

function loadIncomingReports() {
    const container = document.getElementById('incoming-reports');
    if (!container) return;
    
    const reports = JSON.parse(localStorage.getItem('gulfwatch_reports') || '[]');
    
    if (reports.length === 0) {
        container.innerHTML = '<p class="text-muted">No pending reports</p>';
        return;
    }
    
    // Sort by newest first
    reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let html = '<div class="reports-list">';
    reports.slice(0, 10).forEach(report => {
        const date = new Date(report.timestamp).toLocaleString();
        const reasonLabels = {
            'false': 'False information',
            'misleading': 'Misleading content',
            'outdated': 'Outdated/incorrect date',
            'duplicate': 'Duplicate incident',
            'location': 'Wrong location',
            'other': 'Other'
        };
        html += `
            <div class="report-item">
                <div class="report-header">
                    <span class="report-reason">${reasonLabels[report.reason] || report.reason}</span>
                    <span class="report-date">${date}</span>
                </div>
                <div class="report-details">${report.details || 'No details provided'}</div>
                <div class="report-incident">Incident #${report.incidentId}</div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

function loadVerificationStats() {
    // Calculate stats from incidents
    const stats = {
        validated: 0,
        pending: 0,
        disputed: 0
    };
    
    state.incidents.forEach(incident => {
        const verification = incident.verification || {};
        const badge = verification.badge || 'UNCONFIRMED';
        
        if (badge === 'VERIFIED') stats.validated++;
        else if (badge === 'DISPUTED') stats.disputed++;
        else stats.pending++;
    });
    
    const updateEl = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateEl('validated-count', stats.validated);
    updateEl('pending-count', stats.pending);
    updateEl('disputed-count', stats.disputed);
}

// Make modal functions globally available
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.openTranslateModal = openTranslateModal;
window.closeTranslateModal = closeTranslateModal;
window.containsArabic = containsArabic;

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
