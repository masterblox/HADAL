# GulfWatch Testing and Development 🎯

[![Live Site](https://img.shields.io/badge/Live-Testing%20Environment-orange)](https://gulfwatch-testing.vercel.app)

**⚠️ This is a TESTING and DEVELOPMENT environment for GulfWatch features.**

**Production:** https://gulfwatch.live  
**Testing:** https://gulfwatch-testing.vercel.app

---

## What's This?

GulfWatch Testing is the **staging environment** for experimenting with new features before they go to production. This is where we:

- Test new UI components
- Experiment with data sources
- Build and verify cross-source verification
- Debug and iterate quickly

**⚠️ Data may be incomplete or experimental. Use https://gulfwatch.live for production monitoring.**

---

## Current Features in Testing

### 🔍 Cross-Source Verification
The main feature being tested here is **source verification and confidence scoring**:

**Verification Badges:**
- 🟣 **Verified (90%+)** - Multiple government sources confirm
- 🔵 **Likely True (70-89%)** - Government + news sources
- 🟡 **Partial (50-69%)** - Limited source confirmation
- ⚪ **Unconfirmed (<50%)** - Single source or low credibility

**Click any incident to see:**
- Confidence score (percentage)
- Source breakdown (Government 🏛️ / News 📰 / Social 💬)
- Timeline of when each source reported
- Source variants (different reports of same incident)

### 📱 Mobile-First Design
- **Desktop:** Side panel with full verification details
- **Mobile:** Bottom sheet slides up with same info
- Optimized for quick checking on the go

### 📊 Data Sources
- 24 government RSS feeds (via RSS.app)
- NewsData.io API integration
- Cross-source deduplication
- Confidence scoring algorithm

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  RSS.app Feeds  │────▶│  GitHub Actions │────▶│  verified_      │
│  (24 accounts)  │     │  (every hour)   │     │  incidents.json │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐            │
│  NewsData.io    │────▶│  Cross-Source   │────────────┘
│  API            │     │  Verification   │
└─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Deduplication  │
                        │  + Confidence   │
                        │  Scoring        │
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Vercel Deploy  │
                        │  gulfwatch-     │
                        │  testing.vercel │
                        └─────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `verified_incidents.json` | Deduplicated incidents with verification scores |
| `moi_missile_stats.json` | UAE MoI missile interception data |
| `prices.json` | Oil/gold market prices |
| `index.html` | Main UI with verification panel |

---

## Verification Scoring

### Confidence Levels

| Score | Status | Color | Meaning |
|-------|--------|-------|---------|
| 90-100% | Verified | 🟣 Purple | 2+ government sources confirm |
| 70-89% | Likely True | 🔵 Blue | Government + news confirm |
| 50-69% | Partial | 🟡 Yellow | Limited confirmation |
| <50% | Unconfirmed | ⚪ Gray | Single source or questionable |

### Source Weights

| Source Type | Weight | Example |
|-------------|--------|---------|
| Government Ministry | 1.0 | UAE MoI, Saudi MoD |
| State News Agency | 0.95 | WAM, KUNA |
| International News | 0.85 | Reuters, BBC |
| Regional News | 0.80 | Al Jazeera |
| Social/Telegram | 0.60 | Citizen reports |

### Bonuses
- +0.15 per additional government source (max +0.30)
- +0.10 per additional source of any type (max +0.30)

---

## Data Sources (Testing)

### 🇦🇪 UAE Government (8)
- Ministry of Interior
- Ministry of Defence  
- National Emergency Crisis & Disasters Management Authority
- National Guard
- Government Media Office
- WAM News Agency
- Dubai Media Office
- Abu Dhabi Civil Defence

### 🇸🇦 Saudi Arabia (2)
- Ministry of Interior
- Civil Defense

### 🇶🇦 Qatar (4)
- Ministry of Interior
- Civil Defence
- Ministry of Defence
- Qatar News Agency

### 🇰🇼 Kuwait (2)
- Fire Force
- News Agency

### 🇧🇭 Bahrain (1)
- Ministry of Interior

### 🇴🇲 Oman (1)
- Royal Oman Police

### 🇮🇱 Israel (2)
- Ministry of Defense
- Magen David Adom

### 🇮🇷 Iran (2)
- Mehr News Agency
- Fars News Agency

---

## Local Development

```bash
# Clone
git clone https://github.com/nKOxxx/gulfwatch-testing.git
cd gulfwatch-testing

# Serve locally
cd public
python -m http.server 8000

# Open http://localhost:8000
```

---

## Environment Variables (for full features)

Set in Vercel dashboard or `.env`:

```
NEWSDATA_API_KEY=your_newsdata_key
```

Get free key at: https://newsdata.io/

---

## Workflow

1. **Develop new features here** (gulfwatch-testing)
2. **Test thoroughly** on mobile + desktop
3. **Migrate working features** to production (gulfwatch.live)
4. **Archive experiments** that don't work

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS, Leaflet Maps
- **Data:** Python, GitHub Actions
- **Hosting:** Vercel (static)
- **RSS:** RSS.app (Twitter/X to RSS)
- **News API:** NewsData.io

---

## Colors

| Type | Color | Hex |
|------|-------|-----|
| Missile | 🔴 Red | #e74c3c |
| Drone | 🟠 Orange | #f39c12 |
| Air Defense | 🔵 Blue | #3498db |
| Explosion | 🩷 Pink | #e91e63 |
| Verified | 🟣 Purple | #9b59b6 |
| Government Badge | 🟡 Gold | #FFD700 |

---

## License
MIT - Fork and experiment freely!

---

**[View Production Site →](https://gulfwatch.live)**  
**[View Testing Site →](https://gulfwatch-testing.vercel.app)**

*Built with ⚔️ for Gulf security monitoring*
