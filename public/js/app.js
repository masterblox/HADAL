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
            }
        });
    });
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
                    <button class="action-btn" onclick="window.open('${escapeHtml(sourceUrl)}', '_blank')" title="View Source">
                        🔗 Source
                    </button>
                    <button class="action-btn" onclick="openTranslateModal(${incident.id})" title="Translate">
                        🌐 Translate
                    </button>
                    <button class="action-btn report-btn" onclick="openReportModal(${incident.id})" title="Report False Claim">
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

function openTranslateModal(incidentId) {
    const modal = document.getElementById('translate-modal');
    const originalText = document.getElementById('translate-original');
    const resultDiv = document.getElementById('translate-result');
    const translateLink = document.getElementById('translate-link');
    
    const incident = state.incidents.find(i => i.id === incidentId);
    if (!incident) return;
    
    if (modal && originalText) {
        originalText.textContent = incident.title;
        
        // Create Google Translate link
        const encodedText = encodeURIComponent(incident.title);
        translateLink.href = `https://translate.google.com/?sl=auto&tl=en&text=${encodedText}&op=translate`;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Try to fetch translation using a free API (LibreTranslate)
        resultDiv.innerHTML = '<div class="translate-loading">Translating...</div>';
        
        // For now, just show the Google Translate option
        resultDiv.innerHTML = `
            <p style="color: var(--text-secondary); margin-bottom: 12px;">
                Click "Open in Google Translate" below to translate this incident.
            </p>
        `;
    }
}

function closeTranslateModal() {
    const modal = document.getElementById('translate-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make modal functions globally available
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.openTranslateModal = openTranslateModal;
window.closeTranslateModal = closeTranslateModal;
