#!/usr/bin/env python3
"""
Gulf Watch Airspace Tracker
Fetches NOTAMs (Notice to Airmen) for Gulf region airports
Tracks flight restrictions, airspace closures, and hazards
"""

import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional
import urllib.request
import urllib.parse

# Gulf region airports (ICAO codes)
GULF_AIRPORTS = {
    # UAE
    'OMDB': {'name': 'Dubai International', 'country': 'UAE', 'lat': 25.2532, 'lng': 55.3657},
    'OMAA': {'name': 'Abu Dhabi International', 'country': 'UAE', 'lat': 24.4330, 'lng': 54.6511},
    'OMDW': {'name': 'Al Maktoum International', 'country': 'UAE', 'lat': 24.8964, 'lng': 55.1614},
    'OMSJ': {'name': 'Sharjah International', 'country': 'UAE', 'lat': 25.3286, 'lng': 55.5172},
    
    # Saudi Arabia
    'OERK': {'name': 'King Khalid International', 'country': 'Saudi Arabia', 'lat': 24.9576, 'lng': 46.6988},
    'OEJN': {'name': 'King Abdulaziz International', 'country': 'Saudi Arabia', 'lat': 21.6796, 'lng': 39.1565},
    'OEMA': {'name': 'Prince Mohammad Bin Abdulaziz', 'country': 'Saudi Arabia', 'lat': 24.5534, 'lng': 39.7051},
    
    # Qatar
    'OTHH': {'name': 'Hamad International', 'country': 'Qatar', 'lat': 25.2731, 'lng': 51.6080},
    
    # Kuwait
    'OKBK': {'name': 'Kuwait International', 'country': 'Kuwait', 'lat': 29.2266, 'lng': 47.9689},
    
    # Bahrain
    'OBBI': {'name': 'Bahrain International', 'country': 'Bahrain', 'lat': 26.2708, 'lng': 50.6336},
    
    # Oman
    'OOMS': {'name': 'Muscat International', 'country': 'Oman', 'lat': 23.5933, 'lng': 58.2844},
    
    # Iraq
    'ORBI': {'name': 'Baghdad International', 'country': 'Iraq', 'lat': 33.2625, 'lng': 44.2346},
    'ORER': {'name': 'Erbil International', 'country': 'Iraq', 'lat': 36.2376, 'lng': 43.9633},
    
    # Iran
    'OIIE': {'name': 'Imam Khomeini International', 'country': 'Iran', 'lat': 35.4161, 'lng': 51.1522},
    'OIMM': {'name': 'Mashhad International', 'country': 'Iran', 'lat': 36.2341, 'lng': 59.6430},
    
    # Israel
    'LLBG': {'name': 'Ben Gurion Airport', 'country': 'Israel', 'lat': 32.0117, 'lng': 34.8867},
    'LLHA': {'name': 'Haifa Airport', 'country': 'Israel', 'lat': 32.8094, 'lng': 35.0431},
    
    # Jordan
    'OJAI': {'name': 'Queen Alia International', 'country': 'Jordan', 'lat': 31.7225, 'lng': 35.9932},
    
    # Lebanon
    'OLBA': {'name': 'Beirut-Rafic Hariri', 'country': 'Lebanon', 'lat': 33.8209, 'lng': 35.4884},
}

# NOTAM categories for filtering
NOTAM_CATEGORIES = {
    'AIRSPACE': ['airspace', 'restricted', 'prohibited', 'danger', 'warning'],
    'AIRPORT': ['aerodrome', 'runway', 'taxiway', 'apron', 'closed'],
    'NAVIGATION': ['navaid', 'ils', 'vor', 'ndb', 'gps', 'navigation'],
    'COMMUNICATION': ['communication', 'radio', 'atis', 'atis'],
    'HAZARD': ['rocket', 'missile', 'gunfire', 'unmanned', 'drone', 'uav', 'balloon'],
    'CONFLICT': ['conflict', 'war', 'hostile', 'military', 'exercise'],
}

def fetch_faa_notams(icao: str) -> List[Dict]:
    """
    Fetch NOTAMs from FAA website for given ICAO code
    Returns parsed NOTAM data
    """
    notams = []
    
    try:
        # FAA NOTAM search URL
        url = f"https://www.notams.faa.gov/dinsQueryWeb/queryRetrievalMapAction.do?reportType=Raw+data+report&retrieveLocId={icao}"
        
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # Parse NOTAMs from HTML response
            # NOTAM format: !AIRPORT CODE NOTAM CODE
            notam_pattern = r'!([A-Z]{4})\s+(\w{5}/\d{2})\s+(.+?)(?=![A-Z]{4}|$)'
            matches = re.findall(notam_pattern, html, re.DOTALL)
            
            for match in matches:
                airport, notam_id, content = match
                
                # Clean up content
                content = ' '.join(content.split())
                
                # Extract valid times
                valid_from, valid_until = extract_validity(content)
                
                # Categorize NOTAM
                category = categorize_notam(content)
                
                # Extract coordinates if present
                coordinates = extract_coordinates(content)
                
                notam = {
                    'id': notam_id,
                    'icao': airport,
                    'content': content[:500],  # Truncate long NOTAMs
                    'category': category,
                    'valid_from': valid_from,
                    'valid_until': valid_until,
                    'coordinates': coordinates,
                    'severity': calculate_severity(content, category),
                    'issued_at': datetime.now(timezone.utc).isoformat(),
                }
                
                notams.append(notam)
                
    except Exception as e:
        print(f"   ⚠️  Error fetching NOTAMs for {icao}: {str(e)[:50]}")
    
    return notams

def extract_validity(content: str) -> tuple:
    """Extract valid from/until times from NOTAM content"""
    valid_from = None
    valid_until = None
    
    # Pattern: 2603121200-2603121600 (YYMMDDHHMM-YYMMDDHHMM)
    time_pattern = r'(\d{10})-(\d{10})'
    match = re.search(time_pattern, content)
    
    if match:
        from_str, until_str = match.groups()
        try:
            # Parse YYMMDDHHMM format
            valid_from = datetime.strptime(from_str, '%y%m%d%H%M').isoformat()
            valid_until = datetime.strptime(until_str, '%y%m%d%H%M').isoformat()
        except:
            pass
    
    return valid_from, valid_until

def categorize_notam(content: str) -> str:
    """Categorize NOTAM based on content keywords"""
    content_lower = content.lower()
    
    for category, keywords in NOTAM_CATEGORIES.items():
        if any(kw in content_lower for kw in keywords):
            return category
    
    return 'GENERAL'

def extract_coordinates(content: str) -> Optional[Dict]:
    """Extract coordinates from NOTAM if present"""
    # Pattern: N2530E05545 (N DD MM E DDD MM)
    coord_pattern = r'([NS])(\d{4,6})\s*([EW])(\d{5,7})'
    match = re.search(coord_pattern, content)
    
    if match:
        lat_dir, lat_val, lng_dir, lng_val = match.groups()
        
        # Parse coordinates
        lat_deg = int(lat_val[:2])
        lat_min = int(lat_val[2:4]) if len(lat_val) >= 4 else 0
        lat = lat_deg + lat_min / 60
        if lat_dir == 'S':
            lat = -lat
        
        lng_deg = int(lng_val[:3])
        lng_min = int(lng_val[3:5]) if len(lng_val) >= 5 else 0
        lng = lng_deg + lng_min / 60
        if lng_dir == 'W':
            lng = -lng
        
        return {'lat': round(lat, 4), 'lng': round(lng, 4)}
    
    return None

def calculate_severity(content: str, category: str) -> str:
    """Calculate severity level of NOTAM"""
    content_lower = content.lower()
    
    # Critical keywords
    critical = ['closed', 'prohibited', 'danger', 'missile', 'rocket', 'gunfire', 'conflict']
    if any(kw in content_lower for kw in critical):
        return 'CRITICAL'
    
    # Warning keywords
    warning = ['restricted', 'caution', 'unmanned', 'drone', 'uav', 'military']
    if any(kw in content_lower for kw in warning):
        return 'WARNING'
    
    # High priority categories
    if category in ['HAZARD', 'CONFLICT', 'AIRSPACE']:
        return 'ELEVATED'
    
    return 'INFORMATION'

def generate_airspace_data():
    """Generate airspace restriction data for Gulf Watch"""
    print("🛫 Gulf Watch Airspace Tracker")
    print("=" * 50)
    print(f"⏰ {datetime.now(timezone.utc).isoformat()} UTC")
    print()
    
    all_notams = []
    
    # Fetch NOTAMs for all Gulf airports
    for icao, info in GULF_AIRPORTS.items():
        print(f"📡 Fetching NOTAMs for {icao} ({info['name']})...")
        
        notams = fetch_faa_notams(icao)
        
        # Add airport metadata
        for notam in notams:
            notam['airport'] = info['name']
            notam['country'] = info['country']
            if not notam['coordinates']:
                notam['coordinates'] = {'lat': info['lat'], 'lng': info['lng']}
        
        all_notams.extend(notams)
        print(f"   Found {len(notams)} NOTAMs")
    
    # Sort by severity
    severity_order = {'CRITICAL': 0, 'WARNING': 1, 'ELEVATED': 2, 'INFORMATION': 3}
    all_notams.sort(key=lambda x: severity_order.get(x['severity'], 4))
    
    # Count by severity
    severity_counts = {}
    for notam in all_notams:
        sev = notam['severity']
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    
    # Generate output
    output = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'total_notams': len(all_notams),
        'severity_counts': severity_counts,
        'airports_tracked': len(GULF_AIRPORTS),
        'notams': all_notams
    }
    
    # Write to JSON
    with open('public/airspace.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print()
    print("=" * 50)
    print(f"✅ Generated {len(all_notams)} NOTAMs")
    print(f"   CRITICAL: {severity_counts.get('CRITICAL', 0)}")
    print(f"   WARNING: {severity_counts.get('WARNING', 0)}")
    print(f"   ELEVATED: {severity_counts.get('ELEVATED', 0)}")
    print(f"   INFORMATION: {severity_counts.get('INFORMATION', 0)}")
    print(f"📁 Saved to public/airspace.json")

if __name__ == '__main__':
    generate_airspace_data()
