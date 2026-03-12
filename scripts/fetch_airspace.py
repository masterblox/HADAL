#!/usr/bin/env python3
"""
Gulf Watch Airspace Tracker - TEST VERSION
Generates sample NOTAM data for testing UI
"""

import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict

# Gulf region airports
GULF_AIRPORTS = {
    'OMDB': {'name': 'Dubai International', 'country': 'UAE', 'lat': 25.2532, 'lng': 55.3657},
    'OMAA': {'name': 'Abu Dhabi International', 'country': 'UAE', 'lat': 24.4330, 'lng': 54.6511},
    'OERK': {'name': 'King Khalid International', 'country': 'Saudi Arabia', 'lat': 24.9576, 'lng': 46.6988},
    'OEJN': {'name': 'King Abdulaziz International', 'country': 'Saudi Arabia', 'lat': 21.6796, 'lng': 39.1565},
    'OTHH': {'name': 'Hamad International', 'country': 'Qatar', 'lat': 25.2731, 'lng': 51.6080},
    'OKBK': {'name': 'Kuwait International', 'country': 'Kuwait', 'lat': 29.2266, 'lng': 47.9689},
    'OBBI': {'name': 'Bahrain International', 'country': 'Bahrain', 'lat': 26.2708, 'lng': 50.6336},
    'OOMS': {'name': 'Muscat International', 'country': 'Oman', 'lat': 23.5933, 'lng': 58.2844},
    'ORBI': {'name': 'Baghdad International', 'country': 'Iraq', 'lat': 33.2625, 'lng': 44.2346},
    'OIIE': {'name': 'Imam Khomeini International', 'country': 'Iran', 'lat': 35.4161, 'lng': 51.1522},
    'LLBG': {'name': 'Ben Gurion Airport', 'country': 'Israel', 'lat': 32.0117, 'lng': 34.8867},
    'OLBA': {'name': 'Beirut-Rafic Hariri', 'country': 'Lebanon', 'lat': 33.8209, 'lng': 35.4884},
}

# Sample NOTAMs for testing
SAMPLE_NOTAMS = [
    {
        'icao': 'OMDB',
        'category': 'HAZARD',
        'severity': 'WARNING',
        'content': 'UAS (DRONE) ACTIVITY REPORTED WITHIN 5NM OF AIRPORT. PILOTS ADVISED TO EXERCISE CAUTION.',
    },
    {
        'icao': 'OIIE',
        'category': 'AIRSPACE',
        'severity': 'CRITICAL',
        'content': 'AIRSPACE RESTRICTED DUE TO MILITARY EXERCISES. ALL FLIGHTS SUSPENDED 1200-1600Z.',
    },
    {
        'icao': 'LLBG',
        'category': 'HAZARD',
        'severity': 'WARNING',
        'content': 'MISSILE DEFENSE SYSTEM ACTIVE. AIR DEFENSE EXERCISES IN PROGRESS.',
    },
    {
        'icao': 'ORBI',
        'category': 'CONFLICT',
        'severity': 'ELEVATED',
        'content': 'MILITARY AIR TRAFFIC INCREASED. CIVILIAN AIRCRAFT ADVISED TO MAINTAIN RADIO CONTACT.',
    },
    {
        'icao': 'OEJN',
        'category': 'AIRSPACE',
        'severity': 'INFORMATION',
        'content': 'TEMPORARY RESTRICTED AREA ESTABLISHED FOR VIP MOVEMENT.',
    },
    {
        'icao': 'OTHH',
        'category': 'AIRPORT',
        'severity': 'INFORMATION',
        'content': 'RUNWAY 16R/34L CLOSED FOR MAINTENANCE. USE RUNWAY 16L/34R.',
    },
    {
        'icao': 'OLBA',
        'category': 'HAZARD',
        'severity': 'WARNING',
        'content': 'AIRSPACE RESTRICTIONS DUE TO CROSS-BORDER ACTIVITY. FLIGHTS DIVERTED.',
    },
    {
        'icao': 'OMAA',
        'category': 'NAVIGATION',
        'severity': 'INFORMATION',
        'content': 'VOR/DME U/S. ALTERNATE NAVIGATION REQUIRED. GPS APPROACHES AVAILABLE.',
    },
    {
        'icao': 'OERK',
        'category': 'AIRSPACE',
        'severity': 'ELEVATED',
        'content': 'TEMPORARY FLIGHT RESTRICTION FOR MILITARY AIRCRAFT MOVEMENT.',
    },
    {
        'icao': 'OKBK',
        'category': 'AIRPORT',
        'severity': 'INFORMATION',
        'content': 'CONSTRUCTION WORK ON APRON. REDUCED PARKING CAPACITY.',
    },
]

def generate_sample_airspace_data():
    """Generate sample airspace data for testing"""
    print("🛫 Gulf Watch Airspace Tracker (TEST MODE)")
    print("=" * 50)
    print(f"⏰ {datetime.now(timezone.utc).isoformat()} UTC")
    print("NOTE: Using sample NOTAM data for UI testing")
    print()
    
    all_notams = []
    now = datetime.now(timezone.utc)
    
    for sample in SAMPLE_NOTAMS:
        airport = GULF_AIRPORTS[sample['icao']]
        
        notam = {
            'id': f"TEST{len(all_notams)+1:03d}/26",
            'icao': sample['icao'],
            'airport': airport['name'],
            'country': airport['country'],
            'content': sample['content'],
            'category': sample['category'],
            'severity': sample['severity'],
            'coordinates': {'lat': airport['lat'], 'lng': airport['lng']},
            'valid_from': now.isoformat(),
            'valid_until': (now + timedelta(hours=8)).isoformat(),
            'issued_at': now.isoformat(),
        }
        
        all_notams.append(notam)
        print(f"✅ {sample['icao']}: {sample['severity']} - {sample['category']}")
    
    # Count by severity
    severity_counts = {}
    for notam in all_notams:
        sev = notam['severity']
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    
    # Generate output
    output = {
        'generated_at': now.isoformat(),
        'total_notams': len(all_notams),
        'severity_counts': severity_counts,
        'airports_tracked': len(GULF_AIRPORTS),
        'notams': all_notams,
        'note': 'TEST DATA - For production, use ICAO API or FAA NOTAM feed'
    }
    
    # Write to JSON
    with open('public/airspace.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print()
    print("=" * 50)
    print(f"✅ Generated {len(all_notams)} sample NOTAMs")
    print(f"   CRITICAL: {severity_counts.get('CRITICAL', 0)}")
    print(f"   WARNING: {severity_counts.get('WARNING', 0)}")
    print(f"   ELEVATED: {severity_counts.get('ELEVATED', 0)}")
    print(f"   INFORMATION: {severity_counts.get('INFORMATION', 0)}")
    print(f"📁 Saved to public/airspace.json")
    print()
    print("📝 For production NOTAMs, configure ICAO API:")
    print("   https://applications.icao.int/dataservices/")

if __name__ == '__main__':
    generate_sample_airspace_data()
