/**
 * Gulf Watch Regional Panel
 * Regional overview with per-country drill-down
 */

class RegionalPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.apiUrl = options.apiUrl || '/data/regional_stats.json';
    this.currentView = 'regional'; // 'regional' or country code
    this.data = null;
    this.selectedMetric = 'casualties';
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.render();
    this.startAutoRefresh();
  }
  
  async loadData() {
    try {
      const response = await fetch(this.apiUrl + '?t=' + Date.now());
      this.data = await response.json();
    } catch (e) {
      console.error('Failed to load regional stats:', e);
      this.renderError();
    }
  }
  
  startAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(() => this.loadData(), 5 * 60 * 1000);
  }
  
  render() {
    if (!this.data) return;
    
    if (this.currentView === 'regional') {
      this.renderRegionalView();
    } else {
      this.renderCountryView(this.currentView);
    }
  }
  
  renderRegionalView() {
    const regional = this.data.regional;
    
    const html = `
      <div class="regional-panel">
        <div class="regional-header">
          <h2>🌍 Regional Overview</h2>
          <span class="last-updated">Updated: ${this.formatTime(this.data.lastUpdated)}</span>
        </div>
        
        <!-- Key Metrics Grid -->
        <div class="metrics-grid">
          ${this.renderMetricCard('casualties', '👥', '#e74c3c', regional.casualties.total, 
            `${regional.casualties.military} military, ${regional.casualties.civilian} civilian`)}
          ${this.renderMetricCard('missiles', '🚀', '#e67e22', regional.missiles.launched,
            `${regional.missiles.intercepted} intercepted, ${regional.missiles.landed} landed`)}
          ${this.renderMetricCard('airstrikes', '✈️', '#f39c12', regional.airstrikes.total, 'total strikes')}
          ${this.renderMetricCard('drones', '🛸', '#27ae60', regional.drones.total,
            `${regional.drones.downed} downed`)}
        </div>
        
        <!-- Metric Filter -->
        <div class="metric-filter">
          <label>View by:</label>
          <select id="metricFilter" onchange="regionalPanel.setMetric(this.value)">
            <option value="casualties" ${this.selectedMetric === 'casualties' ? 'selected' : ''}>Casualties</option>
            <option value="missiles" ${this.selectedMetric === 'missiles' ? 'selected' : ''}>Missiles</option>
            <option value="airstrikes" ${this.selectedMetric === 'airstrikes' ? 'selected' : ''}>Airstrikes</option>
            <option value="drones" ${this.selectedMetric === 'drones' ? 'selected' : ''}>Drones</option>
            <option value="incidents" ${this.selectedMetric === 'incidents' ? 'selected' : ''}>All Incidents</option>
          </select>
        </div>
        
        <!-- Country Breakdown -->
        <div class="country-breakdown">
          <h3>By Country</h3>
          <div class="country-list">
            ${this.renderCountryList()}
          </div>
        </div>
        
        <!-- Expand All -->
        <button class="expand-all-btn" onclick="regionalPanel.expandAllCountries()">
          + Expand All Countries
        </button>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  renderMetricCard(type, icon, color, value, subtitle) {
    const isSelected = this.selectedMetric === type;
    return `
      <div class="metric-card ${isSelected ? 'selected' : ''}" 
           onclick="regionalPanel.setMetric('${type}')"
           style="--metric-color: ${color}">
        <div class="metric-icon">${icon}</div>
        <div class="metric-value" style="color: ${color}">${value.toLocaleString()}</div>
        <div class="metric-label">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div class="metric-subtitle">${subtitle}</div>
      </div>
    `;
  }
  
  renderCountryList() {
    const countries = Object.entries(this.data.countries)
      .filter(([code, data]) => data.casualties.total > 0 || data.missiles.launched > 0 || data.airstrikes.total > 0)
      .sort((a, b) => {
        // Sort by selected metric
        const aVal = this.getMetricValue(a[1], this.selectedMetric);
        const bVal = this.getMetricValue(b[1], this.selectedMetric);
        return bVal - aVal;
      });
    
    if (countries.length === 0) {
      return '<div class="no-data">No incidents reported</div>';
    }
    
    return countries.map(([code, data]) => {
      const value = this.getMetricValue(data, this.selectedMetric);
      const trend = data.trend;
      const trendIcon = trend === 'increasing' ? '↗️' : trend === 'decreasing' ? '↘️' : '→';
      
      return `
        <div class="country-item" onclick="regionalPanel.showCountry('${code}')">
          <div class="country-flag">${data.flag}</div>
          <div class="country-name">${data.name}</div>
          <div class="country-value">${value.toLocaleString()}</div>
          <div class="country-trend" title="Trend: ${trend}">${trendIcon}</div>
          <div class="country-arrow">›</div>
        </div>
      `;
    }).join('');
  }
  
  renderCountryView(countryCode) {
    const country = this.data.countries[countryCode];
    if (!country) return;
    
    const html = `
      <div class="country-detail-panel">
        <div class="country-detail-header">
          <button class="back-btn" onclick="regionalPanel.showRegional()">← Back</button>
          <div class="country-title">
            <span class="country-flag-large">${country.flag}</span>
            <h2>${country.name}</h2>
          </div>
          <span class="trend-badge ${country.trend}">${country.trend}</span>
        </div>
        
        <!-- Stats Sections -->
        <div class="stats-sections">
          ${this.renderStatsSection('casualties', '👥', '#e74c3c', country.casualties)}
          ${this.renderStatsSection('missiles', '🚀', '#e67e22', country.missiles)}
          ${this.renderStatsSection('airstrikes', '✈️', '#f39c12', country.airstrikes)}
          ${this.renderStatsSection('drones', '🛸', '#27ae60', country.drones)}
        </div>
        
        <!-- Recent Events -->
        <div class="recent-events">
          <h3>Recent Events (${country.incidents.length})</h3>
          <div class="events-list">
            ${country.incidents.slice().reverse().map(inc => `
              <div class="event-item ${inc.type}">
                <div class="event-type-badge">${this.getTypeIcon(inc.type)}</div>
                <div class="event-content">
                  <div class="event-title">${inc.title}</div>
                  <div class="event-meta">
                    <span class="event-time">${this.formatTime(inc.time)}</span>
                    ${inc.casualties > 0 ? `<span class="event-casualties">${inc.casualties} casualties</span>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Actions -->
        <div class="country-actions">
          <button class="action-btn" onclick="regionalPanel.zoomToCountry('${countryCode}')">
            🗺️ View on Map
          </button>
          <button class="action-btn" onclick="regionalPanel.viewTimeline('${countryCode}')">
            📅 View Timeline
          </button>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  renderStatsSection(type, icon, color, data) {
    const entries = Object.entries(data).filter(([k, v]) => k !== 'total' && v > 0);
    
    if (entries.length === 0 && data.total === 0) {
      return '';
    }
    
    return `
      <div class="stats-section" style="--section-color: ${color}">
        <div class="stats-section-header">
          <span class="stats-icon">${icon}</span>
          <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
          <span class="stats-total" style="color: ${color}">${data.total || Object.values(data).reduce((a, b) => a + b, 0)}</span>
        </div>
        <div class="stats-breakdown">
          ${entries.map(([key, value]) => `
            <div class="stat-row">
              <span class="stat-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span class="stat-bar">
                <span class="stat-bar-fill" style="width: ${this.calculateBarWidth(value, data)}%; background: ${color}"></span>
              </span>
              <span class="stat-value">${value.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Helper methods
  getMetricValue(data, metric) {
    if (metric === 'incidents') {
      return data.incidents?.length || 0;
    }
    return data[metric]?.total || 
           data[metric]?.launched || 
           Object.values(data[metric] || {}).reduce((a, b) => a + b, 0);
  }
  
  calculateBarWidth(value, data) {
    const max = Math.max(...Object.values(data).filter(v => typeof v === 'number'));
    return max > 0 ? (value / max) * 100 : 0;
  }
  
  getTypeIcon(type) {
    const icons = {
      missile: '🚀',
      airstrike: '✈️',
      drone: '🛸',
      general: '📍',
      error: '⚠️'
    };
    return icons[type] || '📍';
  }
  
  formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000 / 60; // minutes
    
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }
  
  // Navigation methods
  setMetric(metric) {
    this.selectedMetric = metric;
    this.render();
  }
  
  showCountry(code) {
    this.currentView = code;
    this.render();
  }
  
  showRegional() {
    this.currentView = 'regional';
    this.render();
  }
  
  expandAllCountries() {
    // Could show all countries expanded in a modal
    alert('Feature: Show all countries in detailed view');
  }
  
  zoomToCountry(code) {
    // Trigger map zoom to country bounds
    if (window.map && window.zoomToCountry) {
      window.zoomToCountry(code);
    }
  }
  
  viewTimeline(code) {
    // Could open timeline view
    alert(`Timeline view for ${code}`);
  }
  
  renderError() {
    this.container.innerHTML = `
      <div class="regional-panel error">
        <p>Failed to load regional data</p>
        <button onclick="regionalPanel.loadData()">Retry</button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('regionalPanel')) {
    window.regionalPanel = new RegionalPanel('regionalPanel');
  }
});
