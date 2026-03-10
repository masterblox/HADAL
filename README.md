# Gulf Watch Testing Environment

**Testing and staging environment for Gulf Watch intelligence platform.**

🌐 **Live Demo**: https://gulfwatch-testing.vercel.app

---

## 🎯 Purpose

This repository contains experimental features and enhancements before they are deployed to the production Gulf Watch instance. It serves as a staging ground for:

- Cross-source verification UI
- New data sources (RSS.app, Telegram, Instagram)
- Circuit Breaker deduplication algorithm
- Verification badges and confidence scoring

---

## 🚀 Key Features

### Circuit Breaker Algorithm

Our intelligent data filtering system prevents information overload and ensures you see **unique events only**:

**What It Filters:**
- ✅ **Duplicate Events** - Same incident reported by Reuters, BBC, Al Jazeera = 1 entry
- ✅ **Historical Recaps** - "Weekly Roundup", "Death toll rises to..." articles are blocked
- ✅ **Near-Duplicates** - 92% similarity threshold catches reworded coverage

**Why It Matters:**
Without Circuit Breaker, you would see the same missile strike 5-10 times from different news sources. With it, you see it once, with all sources linked.

**Detection Methods:**
```python
# Duplicate Detection
- Signature matching (incident_type + location + date hash)
- Title/location similarity scoring
- 92% threshold for near-duplicate filtering

# Historical Recap Detection  
- Weighted keyword scoring (weekly roundup, death toll, casualties mount)
- Time range indicators ("over the past week", "since January")
- Multi-location indicators (recaps mention many places)
```

**Stats Tracked:**
- Total events stored
- Duplicates filtered
- Recaps blocked
- Unique incident types

---

### Cross-Source Verification

Color-coded verification badges for every incident:

| Badge | Confidence | Criteria |
|-------|------------|----------|
| 🟣 **Verified** | 90%+ | 3+ independent sources confirm |
| 🔵 **Likely True** | 70-89% | 2 sources or 1 official + 1 news |
| 🟡 **Partial** | 50-69% | Single source or conflicting reports |
| ⚪ **Unconfirmed** | <50% | Single unverified source |

**Side Panel (Desktop) / Bottom Sheet (Mobile):**
- Confidence score breakdown
- Source list with reliability ratings
- Timeline of coverage
- Source variant comparison

---

### Data Sources

**RSS Feeds (48 sources):**
- BBC, Al Jazeera, Reuters (when working)
- Government ministries (WAM, SPA, IDF)
- Defense outlets (Defense News, Jane's)
- Regional news (Times of Israel, Al-Monitor)

**Telegram Channels:**
- @SaudiDCD (Saudi Civil Defense)
- @QatarNewsAgency (QNA)

**RSS.app Integration:**
- 8 UAE government Twitter feeds
- Real-time social media monitoring

---

## 🛠️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Data Sources  │────▶│ Circuit Breaker  │────▶│  Cross-Source   │
│  (RSS/Telegram) │     │  (Deduplication) │     │  Verification   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  Testing UI     │
                                                   │  (Vercel)       │
                                                   └─────────────────┘
```

---

## 📊 Data Quality Metrics

Circuit Breaker continuously improves data quality:

- **Before**: 1 real incident = 5-10 duplicate entries
- **After**: 1 real incident = 1 unique entry with source aggregation

Example:
```
Missile strike on Tel Aviv
├── Reuters: "Israel says missile intercepted"
├── BBC: "Rockets fired at Tel Aviv"  
├── Al Jazeera: "Palestinian factions claim missile launch"
└── IDF: "Iron Dome intercepts incoming projectile"

Result: 1 Gulf Watch entry, 4 sources linked
```

---

## 🧪 Testing

### Run Circuit Breaker Tests

```bash
python3 scripts/circuit_breaker.py
```

Expected output:
```
Test 1: NEW EVENT
[CIRCUIT BREAKER] ACCEPTED: US missile strike targets...

Test 2: DUPLICATE EVENT  
[CIRCUIT BREAKER] Filtered NEAR-DUPLICATE: Similarity: 95.58%

Test 3: HISTORICAL RECAP
[CIRCUIT BREAKER] Filtered RECAP: Weekly Roundup...

Test 4: DIFFERENT EVENT
[CIRCUIT BREAKER] ACCEPTED: Israeli airstrike targets...

✅ ALL TESTS PASSED
```

### Run Comprehensive Audit

```bash
python3 scripts/test_circuit_breaker_audit.py
```

Tests:
- Duplicate detection accuracy
- Historical recap filtering
- Incident type classification
- Location extraction
- Edge cases (empty strings, long titles, special chars)
- Security (SQL injection, XSS attempts)
- Performance (100 events in <5 seconds)
- ID uniqueness

---

## 🚦 Deployment Pipeline

**Testing Environment** (this repo)
↓
**Validation** (7-day stability check)
↓
**Production** (gulf-watch-v2)

---

## 🔗 Links

- **Production**: https://gulf-watch-v2.vercel.app
- **Testing**: https://gulfwatch-testing.vercel.app
- **RSS V3**: https://github.com/nKOxxx/gulf-watch-v3

---

## 📄 License

MIT - See LICENSE file

---

## 🤝 Contributing

1. Test features in this repo
2. Run Circuit Breaker audit
3. Submit PR to gulf-watch-v3 for integration
4. After 7-day stability, promote to production

---

Built with ⚔️ by Ares
