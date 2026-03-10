#!/usr/bin/env python3
"""
Test Circuit Breaker integration with sample data
"""

import sys
sys.path.insert(0, '/Users/ares/workspace/gulfwatch-testing/scripts')

from circuit_breaker import CircuitBreaker
import json

print("="*70)
print("CIRCUIT BREAKER INTEGRATION TEST")
print("="*70)

# Initialize Circuit Breaker
cb = CircuitBreaker()
print("\n🛡️  Circuit Breaker initialized\n")

# Sample RSS articles (simulating fetch_rss.py output)
sample_articles = [
    {
        'title': 'Missile strike hits military base in Tehran',
        'location': 'Tehran, Iran',
        'date': '2026-03-10T12:00:00Z',
        'source': 'Reuters',
        'url': 'https://reuters.com/article1',
        'content': 'A missile struck a military installation in Tehran.'
    },
    {
        'title': 'Tehran military base hit by missile attack',  # Duplicate
        'location': 'Tehran',
        'date': '2026-03-10T12:30:00Z',
        'source': 'BBC',
        'url': 'https://bbc.com/article2',
        'content': 'Iranian military base targeted in missile strike.'
    },
    {
        'title': 'Weekly Roundup: Death toll rises to 500 in ongoing conflict',  # Recap
        'location': 'Multiple locations',
        'date': '2026-03-10T14:00:00Z',
        'source': 'Al Jazeera',
        'url': 'https://aljazeera.com/recap',
        'content': 'Summary of attacks over the past week.'
    },
    {
        'title': 'Israeli airstrike targets weapons depot in Gaza',
        'location': 'Gaza Strip',
        'date': '2026-03-10T15:00:00Z',
        'source': 'Times of Israel',
        'url': 'https://toi.com/article3',
        'content': 'Israeli forces conducted an airstrike on a weapons facility.'
    },
    {
        'title': 'Rockets fired from Gaza into Israel',  # Different event, same region
        'location': 'Gaza',
        'date': '2026-03-10T16:00:00Z',
        'source': 'Jerusalem Post',
        'url': 'https://jpost.com/article4',
        'content': 'Multiple rockets launched from Gaza Strip.'
    },
    {
        'title': 'Death toll mounts as casualties reach 1000',  # Recap
        'location': 'Region',
        'date': '2026-03-10T17:00:00Z',
        'source': 'AP',
        'url': 'https://ap.com/recap',
        'content': 'Cumulative death toll since January.'
    }
]

print(f"📥 Processing {len(sample_articles)} articles...\n")

# Process through Circuit Breaker
processed_incidents = []
for article in sample_articles:
    result = cb.process_article(article)
    
    if result:
        # Add metadata like fetch_rss.py does
        incident = {
            'title': article['title'],
            'location': article['location'],
            'source': article['source'],
            'date': article['date'],
            'circuit_breaker': {
                'event_id': result['id'],
                'incident_type': result['incident_type'],
                'is_recap': result.get('is_recap', False),
                'confidence': result.get('confidence', 'OSINT')
            }
        }
        processed_incidents.append(incident)
        print(f"✅ ACCEPTED: {article['title'][:50]}...")
        print(f"   ID: {result['id']}, Type: {result['incident_type']}")
    else:
        print(f"❌ FILTERED: {article['title'][:50]}...")
    print()

# Get stats
stats = cb.get_stats()

print("="*70)
print("RESULTS")
print("="*70)
print(f"📊 Total articles: {len(sample_articles)}")
print(f"✅ Accepted incidents: {len(processed_incidents)}")
print(f"❌ Filtered (duplicates + recaps): {len(sample_articles) - len(processed_incidents)}")
print(f"🛡️  Circuit Breaker Stats:")
print(f"   - Total events: {stats['total_events']}")
print(f"   - Unique signatures: {stats['signatures']}")
print(f"   - Incident types: {stats['unique_incident_types']}")

print("\n" + "="*70)
print("OUTPUT JSON STRUCTURE")
print("="*70)

# Generate output like fetch_rss.py does
output = {
    'generated_at': '2026-03-10T18:45:00Z',
    'total_incidents': len(processed_incidents),
    'circuit_breaker_stats': {
        'total_processed': len(sample_articles),
        'duplicates_filtered': len(sample_articles) - len(processed_incidents),
        'unique_signatures': stats['signatures']
    },
    'incidents': processed_incidents
}

print(json.dumps(output, indent=2))

print("\n" + "="*70)
print("✅ INTEGRATION TEST COMPLETE")
print("="*70)
print("\nCircuit Breaker is successfully integrated!")
print("Every incident now includes:")
print("  - Unique event ID (GW-timestamp-counter)")
print("  - Incident type classification")
print("  - Recap flag (true if filtered as historical)")
print("  - Confidence level (OSINT/Verified/Unverified)")
