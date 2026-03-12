/**
 * Gulf Watch Regional Panel - Clean Design
 * Country filter with specific country stats + news cards
 */

class RegionalPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.apiUrl = options.apiUrl || '/data/regional_stats.json';
    this.selectedCountry = 'all'; // 'all' or country code
    this.data = null;
    
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
    setInterval(() => this.loadData(), 5 * 60 * 1000);
  }
  
  render() {
    if (!this.data) return;
    
    const html = `
      <div class="regional-panel-clean">
        ${this.renderCountryFilter()}
        ${this.selectedCountry === 'all' ? this.renderAllView() : this.renderCountryView(this.selectedCountry)}
      </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  renderCountryFilter() {
    // Countries must match incident.location.country values
    const countries = [
      {code: 'all', name: 'All', display: 'All'},
      {code: 'UAE', name: 'UAE', display: 'UAE'},
      {code: 'Saudi Arabia', name: 'saudi', display: 'Saudi'},
      {code: 'Qatar', name: 'qatar', display: 'Qatar'},
      {code: 'Kuwait', name: 'kuwait', display: 'Kuwait'},
      {code: 'Bahrain', name: 'bahrain', display: 'Bahrain'},
      {code: 'Oman', name: 'oman', display: 'Oman'},
      {code: 'Israel', name: 'israel', display: 'Israel'},
      {code: 'Iran', name: 'iran', display: 'Iran'},
      {code: 'Lebanon', name: 'lebanon', display: 'Lebanon'},
      {code: 'Palestine', name: 'gaza', display: 'Gaza'},
      {code: 'Syria', name: 'syria', display: 'Syria'},
      {code: 'Yemen', name: 'yemen', display: 'Yemen'},
      {code: 'Iraq', name: 'iraq', display: 'Iraq'},
      {code: 'Jordan', name: 'jordan', display: 'Jordan'}
    ];
    
    const selectedCountryData = countries.find(c => c.code === this.selectedCountry);
    const title = this.selectedCountry === 'all' ? 'REGIONAL OVERVIEW' : 
                  (this.selectedCountry || 'REGIONAL').toUpperCase() + ' OVERVIEW';
    
    return `
      <div class="country-filter">
        <div class="overview-title">${title}</div>
        <div class="filter-label">FILTER BY COUNTRY</div>
        <div class="filter-pills">
          ${countries.map(c => `
            <button class="filter-pill ${this.selectedCountry === c.code ? 'active' : ''}" 
                    onclick="regionalPanel.setCountry('${c.code}')">
              ${c.display}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderAllView() {
    const regional = this.data.regional;
    
    return `
      <div class="stats-overview">
        <div class="stats-grid compact">
          <div class="stat-box casualties">
            <div class="stat-label">CASUALTIES</div>
            <div class="stat-value">${regional.casualties.total.toLocaleString()}</div>
            <div class="stat-detail">${regional.casualties.military} mil / ${regional.casualties.civilian} civ</div>
          </div>
          <div class="stat-box missiles">
            <div class="stat-label">MISSILES</div>
            <div class="stat-value">${regional.missiles.launched.toLocaleString()}</div>
            <div class="stat-detail">${regional.missiles.intercepted} int / ${regional.missiles.landed} land</div>
          </div>
          <div class="stat-box airstrikes">
            <div class="stat-label">AIRSTRIKES</div>
            <div class="stat-value">${regional.airstrikes.total.toLocaleString()}</div>
            <div class="stat-detail">total strikes</div>
          </div>
          <div class="stat-box drones">
            <div class="stat-label">DRONES</div>
            <div class="stat-value">${regional.drones.total.toLocaleString()}</div>
            <div class="stat-detail">${regional.drones.downed} downed</div>
          </div>
        </div>
        
        <div class="last-updated">
          Last updated: ${this.formatTime(this.data.lastUpdated)}
        </div>
      </div>
    `;
  }
  
  renderCountryView(countryCode) {
    const dataKey = this.getDataKey(countryCode);
    const country = dataKey === 'all' ? null : this.data.countries[dataKey];
    if (!country) return '<div class="no-data">No data available for ' + countryCode + '</div>';
    
    return `
      <div class="country-stats">
        <div class="country-header">
          <span class="country-flag-large">${country.flag}</span>
          <span class="country-name-large">${country.name}</span>
          <span class="trend-badge ${country.trend}">${country.trend}</span>
        </div>
        
        <div class="stats-grid compact">
          <div class="stat-box casualties">
            <div class="stat-label">CASUALTIES</div>
            <div class="stat-value">${country.casualties.total.toLocaleString()}</div>
            <div class="stat-bar">
              <div class="stat-bar-fill military" style="width: ${this.getPercentage(country.casualties.military, country.casualties.total)}%"></div>
              <div class="stat-bar-fill civilian" style="width: ${this.getPercentage(country.casualties.civilian, country.casualties.total)}%"></div>
            </div>
            <div class="stat-detail">${country.casualties.military} mil / ${country.casualties.civilian} civ</div>
          </div>
          
          <div class="stat-box missiles">
            <div class="stat-label">MISSILES</div>
            <div class="stat-value">${country.missiles.launched.toLocaleString()}</div>
            <div class="stat-detail">${country.missiles.intercepted} int / ${country.missiles.landed} land</div>
          </div>
          
          <div class="stat-box airstrikes">
            <div class="stat-label">AIRSTRIKES</div>
            <div class="stat-value">${country.airstrikes.total.toLocaleString()}</div>
            <div class="stat-detail">total strikes</div>
          </div>
          
          <div class="stat-box drones">
            <div class="stat-label">DRONES</div>
            <div class="stat-value">${country.drones.total.toLocaleString()}</div>
            <div class="stat-detail">${country.drones.downed} downed</div>
          </div>
        </div>
        
        ${country.incidents.length > 0 ? `
          <div class="recent-events-compact">
            <div class="events-header">RECENT EVENTS (${country.incidents.length})</div>
            ${country.incidents.slice().reverse().map(inc => `
              <div class="event-row ${inc.type}">
                <span class="event-type">${this.getTypeLabel(inc.type)}</span>
                <span class="event-title">${inc.title}</span>
                ${inc.casualties > 0 ? `<span class="event-casualties">${inc.casualties}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  getPercentage(part, total) {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }
  
  getTypeLabel(type) {
    const labels = {
      missile: 'MSL',
      airstrike: 'AIR',
      drone: 'UAV',
      general: 'INC'
    };
    return labels[type] || type.toUpperCase().slice(0, 3);
  }
  
  setCountry(code) {
    this.selectedCountry = code;
    this.render();
    
    // Sync with main filter system - use full country name for filterIncidents
    if (typeof filterIncidents === 'function') {
      filterIncidents(code);
    }
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('countryFilterChange', { 
      detail: { country: code } 
    }));
  }
  
  // Map full country names to data keys
  getDataKey(countryCode) {
    const mapping = {
      'all': 'all',
      'UAE': 'uae',
      'Saudi Arabia': 'saudi',
      'Qatar': 'qatar',
      'Kuwait': 'kuwait',
      'Bahrain': 'bahrain',
      'Oman': 'oman',
      'Israel': 'israel',
      'Iran': 'iran',
      'Lebanon': 'lebanon',
      'Palestine': 'palestine',
      'Syria': 'syria',
      'Yemen': 'yemen',
      'Iraq': 'iraq',
      'Jordan': 'jordan'
    };
    return mapping[countryCode] || countryCode.toLowerCase();
  }
  
  formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  renderError() {
    this.container.innerHTML = `
      <div class="regional-panel-clean error">
        <p>Failed to load regional data</p>
        <button onclick="regionalPanel.loadData()">Retry</button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('regional-panel')) {
    window.regionalPanel = new RegionalPanel('regional-panel');
  }
});
