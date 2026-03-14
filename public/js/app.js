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
                    <button class="action-btn" onclick="event.stopPropagation(); openTranslateModal('${escapeHtml(incident.title)}')" title="Translate">
                        🌐 Translate
                    </button>
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

function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    // Initialize Leaflet
    state.map = L.map('map', {
        center: [29.0, 48.0],
        zoom: 6,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false
    });
    
    // Add zoom control to top right
    L.control.zoom({
        position: 'topright'
    }).addTo(state.map);
    
    // Add dark theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(state.map);
    
    // Layer toggles
    document.querySelectorAll('.layer-toggle input').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const layer = e.target.dataset.layer;
            const isActive = e.target.checked;
            
            if (layer === 'airspace') {
                toggleAirspaceLayer(isActive);
            }
            
            e.target.parentElement.classList.toggle('active', isActive);
        });
    });
    
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!state.map) return;
    
    // Clear existing markers
    state.markers.forEach(marker => state.map.removeLayer(marker));
    state.markers = [];
    
    // Add markers for filtered incidents
    state.filteredIncidents.forEach(incident => {
        if (!incident.location?.lat || !incident.location?.lng) return;
        
        const { lat, lng } = incident.location;
        const severity = getSeverityLevel(incident);
        const color = getSeverityColor(severity);
        
        // Create custom marker
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(state.map);
        
        // Add popup
        const popupContent = `
            <div style="font-family: var(--font-sans); min-width: 200px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${escapeHtml(incident.title?.substring(0, 60))}...</div>
                <div style="font-size: 12px; color: var(--text-muted);">
                    ${getFlagEmoji(incident.location?.country)} ${incident.source || 'Unknown'} • ${getTimeAgo(incident.published)}
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Click to select
        marker.on('click', () => {
            selectIncident(incident.id);
        });
        
        state.markers.push(marker);
    });
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
    if (show && !state.airspaceLayer) {
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
