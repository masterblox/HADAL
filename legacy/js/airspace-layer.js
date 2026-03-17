/**
 * Gulf Watch Airspace Layer
 * Displays NOTAMs and airspace restrictions on map
 */

class AirspaceLayer {
  constructor(map) {
    this.map = map;
    this.notams = [];
    this.markers = [];
    this.layerGroup = L.layerGroup().addTo(map);
    this.visible = false;
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.render();
  }
  
  async loadData() {
    try {
      const response = await fetch('/airspace.json?t=' + Date.now());
      const data = await response.json();
      this.notams = data.notams || [];
      console.log(`[Airspace] Loaded ${this.notams.length} NOTAMs`);
    } catch (e) {
      console.error('[Airspace] Failed to load:', e);
    }
  }
  
  render() {
    // Clear existing markers
    this.layerGroup.clearLayers();
    this.markers = [];
    
    // Add markers for each NOTAM
    this.notams.forEach(notam => {
      const marker = this.createNotamMarker(notam);
      if (marker) {
        this.layerGroup.addLayer(marker);
        this.markers.push(marker);
      }
    });
  }
  
  createNotamMarker(notam) {
    if (!notam.coordinates) return null;
    
    const { lat, lng } = notam.coordinates;
    const color = this.getSeverityColor(notam.severity);
    const radius = this.getCategoryRadius(notam.category);
    
    // Create circle for airspace restriction
    const circle = L.circle([lat, lng], {
      radius: radius * 1000, // Convert km to meters
      fillColor: color,
      color: color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3
    });
    
    // Add popup with NOTAM details
    const popupContent = `
      <div style="max-width: 300px; font-family: sans-serif;">
        <div style="font-size: 11px; text-transform: uppercase; color: ${color}; font-weight: bold; margin-bottom: 5px;">
          ${notam.severity} • ${notam.category}
        </div>
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 5px;">
          ${notam.airport} (${notam.icao})
        </div>
        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
          ${notam.country}
        </div>
        <div style="font-size: 12px; line-height: 1.4; margin-bottom: 8px;">
          ${notam.content.substring(0, 200)}${notam.content.length > 200 ? '...' : ''}
        </div>
        ${notam.valid_from ? `
          <div style="font-size: 10px; color: #888;">
            Valid: ${this.formatDate(notam.valid_from)} - ${this.formatDate(notam.valid_until)}
          </div>
        ` : ''}
        <div style="font-size: 10px; color: #999; margin-top: 5px;">
          NOTAM ID: ${notam.id}
        </div>
      </div>
    `;
    
    circle.bindPopup(popupContent);
    
    // Add center marker
    const centerMarker = L.circleMarker([lat, lng], {
      radius: 6,
      fillColor: color,
      color: '#fff',
      weight: 2,
      fillOpacity: 1
    });
    
    centerMarker.bindPopup(popupContent);
    
    return circle;
  }
  
  getSeverityColor(severity) {
    const colors = {
      'CRITICAL': '#e74c3c',  // Red
      'WARNING': '#e67e22',   // Orange
      'ELEVATED': '#f39c12',  // Yellow
      'INFORMATION': '#3498db' // Blue
    };
    return colors[severity] || '#95a5a6';
  }
  
  getCategoryRadius(category) {
    // Radius in kilometers
    const radii = {
      'AIRSPACE': 50,
      'HAZARD': 30,
      'CONFLICT': 40,
      'AIRPORT': 10,
      'NAVIGATION': 5,
      'COMMUNICATION': 3,
      'GENERAL': 5
    };
    return radii[category] || 5;
  }
  
  formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.map.addLayer(this.layerGroup);
    } else {
      this.map.removeLayer(this.layerGroup);
    }
    return this.visible;
  }
  
  show() {
    this.visible = true;
    this.map.addLayer(this.layerGroup);
  }
  
  hide() {
    this.visible = false;
    this.map.removeLayer(this.layerGroup);
  }
  
  filterBySeverity(severity) {
    this.layerGroup.clearLayers();
    
    this.notams.forEach(notam => {
      if (severity === 'all' || notam.severity === severity) {
        const marker = this.createNotamMarker(notam);
        if (marker) {
          this.layerGroup.addLayer(marker);
        }
      }
    });
  }
  
  getStats() {
    const stats = {
      total: this.notams.length,
      critical: 0,
      warning: 0,
      elevated: 0,
      information: 0
    };
    
    this.notams.forEach(notam => {
      const sev = notam.severity;
      if (stats[sev.toLowerCase()] !== undefined) {
        stats[sev.toLowerCase()]++;
      }
    });
    
    return stats;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AirspaceLayer;
}
