# Circuit Breaker Integration Guide

## Overview
The Circuit Breaker Algorithm prevents data bloat by:
1. **Deduplicating events** - Same incident from multiple sources = one entry
2. **Filtering historical recaps** - Articles summarizing past events are rejected
3. **Confidence scoring** - Each event gets OSINT/Verified/Unverified label

## Usage

```python
from scripts.circuit_breaker import CircuitBreaker

# Initialize with existing events (if any)
cb = CircuitBreaker(existing_events)

# Process each new article
for article in fetched_articles:
    event = cb.process_article(article)
    
    if event:
        # Event is new and unique - add to database
        database.append(event)
    else:
        # Event was duplicate or recap - skip
        continue

# Get stats
print(cb.get_stats())
```

## Detection Logic

### 1. Duplicate Detection
- **Signature matching**: MD5 hash of incident_type + location_keywords + date
- **Similarity matching**: 85%+ title/location similarity = duplicate
- **Near-duplicate threshold**: 80-85% similarity triggers warning

### 2. Historical Recap Detection
Detects phrases like:
- "update", "recap", "roundup", "wrap", "summary"
- "death toll rises", "casualties mount", "total now"
- "over the past", "in the last", "since [month]"

Recap score >= 2 = filtered

### 3. Incident Type Extraction
Automatically classifies:
- `missile` - missile, rocket, ballistic
- `airstrike` - air strike, bombing
- `drone` - drone, UAV
- `naval` - ship, vessel, maritime
- `cyber` - cyber, hack
- `ground` - infantry, troop
- `explosion` - explosion, blast

## Testing

```bash
cd ~/workspace/gulf-watch-v3
python3 scripts/circuit_breaker.py
```

Expected output:
```
Test 1: NEW EVENT
[CIRCUIT BREAKER] ACCEPTED: US missile strike targets...

Test 2: DUPLICATE EVENT
[CIRCUIT BREAKER] Filtered NEAR-DUPLICATE: US missile strike hits...
                    Similarity: 95.58%

Test 3: HISTORICAL RECAP
[CIRCUIT BREAKER] Filtered RECAP: Weekly Roundup: Death toll rises...

Test 4: DIFFERENT EVENT
[CIRCUIT BREAKER] ACCEPTED: Israeli airstrike targets weapons depot...
```

## Integration with fetch_data.py

Modify your RSS scraping to use Circuit Breaker:

```python
import json
from circuit_breaker import CircuitBreaker

# Load existing incidents
try:
    with open('incidents.json', 'r') as f:
        existing = json.load(f)
except:
    existing = []

# Initialize circuit breaker
cb = CircuitBreaker(existing)

# Process new articles
new_articles = fetch_rss_feeds()  # your existing code

for article in new_articles:
    event = cb.process_article({
        'title': article['title'],
        'location': extract_location(article),  # your function
        'date': article['pubDate'],
        'source': article['source'],
        'url': article['link'],
        'content': article['description']
    })
    
    if event:
        existing.append(event)

# Save deduplicated incidents
with open('incidents.json', 'w') as f:
    json.dump(existing, f, indent=2)

print(f"Stats: {cb.get_stats()}")
```

## Benefits

- **Prevents data bloat** - No more duplicate incidents from multiple sources
- **Cleaner data** - Historical recaps don't pollute the feed
- **Better UX** - Users see unique events only
- **Reduced storage** - Smaller database files
- **Faster loading** - Less data to process and display

## Next Steps

1. Integrate with fetch_data.py
2. Integrate with Telegram scraper
3. Integrate with RSS.app fetcher
4. Deploy to production
