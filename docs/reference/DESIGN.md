# Gulf Watch - Product Architecture & Design System

## Executive Summary

Gulf Watch is a real-time geopolitical intelligence platform monitoring security events across the Middle East. Designed as an operational intelligence system similar to a command center or Bloomberg terminal for geopolitical risk.

**Core Philosophy:** Situational awareness, speed of comprehension, clear visual hierarchy.

---

## Four Intelligence Layers

All features map to one of these layers:

| Layer | Purpose | Features |
|-------|---------|----------|
| **Events** | Real-time incident detection and display | RSS aggregation, Circuit Breaker, Verification, Severity Scoring |
| **Geography** | Spatial context and mapping | Coordinate extraction, Map visualization, Airspace, Trajectories |
| **Analysis** | Strategic insight and patterns | AI summarization, Timeline, Heat maps, Casualty tracking |
| **Data** | Infrastructure and access | API, Exports, RSS feeds, Developer tools |

---

## Five Primary Sections

### 1. Monitor (Landing Page)
**Purpose:** Real-time situational awareness

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Gulf Watch    [Status] [Search] [Filters] [Settings] │ ← Top Command Bar
├──────────┬──────────────────────────────────────┬───────────┤
│          │                                      │           │
│ COUNTRY  │   LIVE INCIDENT FEED                 │ FINANCE   │
│ FILTER   │   ┌────────────────────────────┐     │ IMPACT    │
│          │   │ 🟡 UAE | 2m | Missile      │     │           │
│ Severity │   │ Intercept reported...      │     │ CASUALTY  │
│          │   └────────────────────────────┘     │ TRACKER   │
│ Event    │   ┌────────────────────────────┐     │           │
│ Type     │   │ 🔴 Israel | 5m | Strike    │     │ AIRSPACE  │
│          │   │ IDF confirms airstrike...  │     │ SUMMARY   │
│ Time     │   └────────────────────────────┘     │           │
│ Range    │                                      │ SOURCE    │
│          │                                      │ RELIABIL  │
│ Source   │                                      │           │
│ Filter   │                                      │ CONFLICT  │
│          │                                      │ INTENSITY │
└──────────┴──────────────────────────────────────┴───────────┘
   Left Panel              Main Content              Right Rail
```

**Incident Card Design:**
```
┌────────────────────────────────────────┐
│ 🇦🇪 🟡 2m  MISSILE  85% ✓            │ ← Flag, Severity, Time, Type, Conf, Gov
│ Missile intercepted near Dubai...      │ ← Headline (max 2 lines)
│ Reuters + 3 sources                    │ ← Source badge
└────────────────────────────────────────┘

EXPANDED:
┌────────────────────────────────────────┐
│ [Same header]                          │
├────────────────────────────────────────┤
│ AI Summary:                            │
│ UAE defense systems intercepted a      │
│ ballistic missile over Dubai at 14:32  │
│ local time. No casualties reported.    │
├────────────────────────────────────────┤
│ 📍 25.2048°N, 55.2708°E                │
│ Sources: Reuters, BBC, UAE MOI         │
│ Related: 2 previous incidents in area  │
└────────────────────────────────────────┘
```

**Interactions:**
- New incidents slide in from top with smooth animation
- Click card → Expand + center map
- Hover card → Highlight map marker
- Auto-scroll paused on hover

---

### 2. Map
**Purpose:** Geospatial intelligence and spatial context

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Gulf Watch    [Status] [Search] [Filters] [Settings] │
├──────────┬──────────────────────────────────────┬───────────┤
│          │                                      │           │
│ EVENT    │                                      │ LAYER     │
│ LIST     │         FULL SCREEN MAP              │ CONTROLS  │
│          │                                      │           │
│ ●──●──●  │    🟡                                │ ☑ Events  │
│ │  │  │  │       🔴                             │ ☑ Airspace│
│ ●──●──●  │            🟡                        │ ☐ Troops  │
│          │                                      │ ☐ Traj    │
│ TIMELINE │                                      │           │
│ SLIDER   │                                      │ ZOOM      │
│ [====]   │                                      │ [+][-]    │
└──────────┴──────────────────────────────────────┴───────────┘
```

**Map Markers:**
```
Severity Encoding:
🔴 Critical - Solid red, strong glow pulse
🟠 High - Orange, medium glow
🟡 Medium - Yellow, subtle glow
🟢 Low - Green, no glow

Freshness Encoding:
< 5 min: Pulsing glow intensity
5-30 min: Solid glow
30-60 min: Faint glow
> 1 hour: No glow

Event Type Icons (optional overlay):
🚀 Missile
✈️ Airstrike  
💥 Explosion
🚁 Drone
⚓ Naval
🖥️ Cyber
```

**Interactions:**
- Hover marker → Popup preview card
- Click marker → Highlight feed card + zoom
- Double-click → Zoom to region
- Timeline slider → Filter events by time
- Layer toggles → Show/hide data layers

**Map Layers:**
1. **Events** (base) - All incidents
2. **Airspace** - NOTAMs, restrictions
3. **Ballistic Trajectories** - Missile paths (future)
4. **Troop Movements** - Military positions (future)

---

### 3. Analysis
**Purpose:** Strategic insight and pattern analysis

**Layout (Dashboard Grid):**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Gulf Watch    [Status] [Search] [Filters] [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   TIMELINE   │  │  HEAT MAP    │  │   FINANCE    │      │
│  │              │  │              │  │   IMPACT     │      │
│  │  Events/day  │  │  Country     │  │  Oil + Gold  │      │
│  │  graph       │  │  intensity   │  │  trend       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   CASUALTY   │  │   SOURCE     │  │   CONFLICT   │      │
│  │   TRACKING   │  │  RELIABILITY │  │   GRAPH      │      │
│  │              │  │              │  │              │      │
│  │  Military:   │  │  Govt: 95%   │  │  Node links  │      │
│  │  Civilian:   │  │  News: 75%   │  │  by event    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Modules:**

| Module | Data | Visualization |
|--------|------|---------------|
| Timeline | Incidents over time | Bar/line chart |
| Heat Map | Country incident density | Choropleth map |
| Finance | Oil, Gold, Indices | Sparklines |
| Casualty | Deaths by category | Stacked bars |
| Source Reliability | Trust scores | Horizontal bars |
| Conflict Graph | Event relationships | Network graph |

---

### 4. Data
**Purpose:** Data access and infrastructure

**Layout (Tabbed Interface):**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Gulf Watch    [Status] [Search] [Filters] [Settings] │
├─────────────────────────────────────────────────────────────┤
│ [API Access] [Exports] [RSS] [Docs] [LLM]                   │ ← Tabs
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API ACCESS                                                 │
│  ─────────────────────────────────────────────────────────  │
│  Endpoint: https://gulfwatch-testing.vercel.app/feed.json   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ {                                                   │   │
│  │   "total_incidents": 236,                          │   │
│  │   "incidents": [...]                               │   │
│  │ }                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Download JSON] [Download CSV] [Download GeoJSON]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tabs:**
1. **API Access** - Endpoints, authentication, examples
2. **Exports** - Bulk data download
3. **RSS** - Feed URLs
4. **Docs** - Developer documentation
5. **LLM** - llms.txt, integration guides

---

### 5. Reports
**Purpose:** User interaction and verification workflows

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Gulf Watch    [Status] [Search] [Filters] [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INCOMING REPORTS              VERIFICATION QUEUE          │
│  ────────────────              ─────────────────           │
│                                                             │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │ ⚠️ False Info      │        │ ⏳ Awaiting Review │      │
│  │ UAE incident #123  │        │ 12 incidents       │      │
│  │ Reported: 5m ago   │        │                    │      │
│  │ [Review] [Dismiss] │        │ [Process Queue]    │      │
│  └────────────────────┘        └────────────────────┘      │
│                                                             │
│  SOURCE CREDIBILITY          INCIDENT VALIDATION           │
│  ──────────────────          ───────────────────           │
│                                                             │
│  Govt: ████████████ 95%      Validated: 156                │
│  News:  ████████░░░░ 78%      Pending: 23                  │
│  Social: ████░░░░░░░ 42%      Disputed: 8                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Global Design System

### Color Palette

```css
/* Backgrounds */
--bg-primary: #0a0e27;      /* Deep navy - main background */
--bg-secondary: #111936;     /* Slightly lighter - panels */
--bg-tertiary: #1a2342;      /* Cards, elevated surfaces */
--bg-hover: #232d52;         /* Hover states */

/* Severity Colors */
--severity-critical: #ff4444;  /* Red - glow pulse */
--severity-high: #ff8800;      /* Orange */
--severity-medium: #ffcc00;    /* Yellow */
--severity-low: #44ff88;       /* Green */

/* Accents */
--accent-cyan: #00d4ff;        /* Interactive elements */
--accent-blue: #4a9eff;        /* Links, buttons */

/* Text */
--text-primary: #ffffff;
--text-secondary: #a0aec0;
--text-muted: #64748b;

/* Borders */
--border-subtle: rgba(255,255,255,0.1);
--border-active: rgba(0,212,255,0.5);
```

### Typography

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Sizes */
--text-xs: 11px;      /* Timestamps, badges */
--text-sm: 13px;      /* Secondary info */
--text-base: 14px;    /* Body text */
--text-lg: 16px;      /* Headlines */
--text-xl: 20px;      /* Section headers */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
```

### Spacing System

```css
/* 4px base unit */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

### Component Library

#### Incident Card
```
Specs:
- Background: bg-tertiary
- Border: 1px solid border-subtle
- Border-radius: 6px
- Padding: 12px 16px
- Margin-bottom: 8px
- Hover: bg-hover, border-accent

Structure:
[Flag] [Severity] [Time] [Type] [Conf] [Gov]
[Headline - 2 lines max]
[Source badge]
```

#### Filter Chip
```
Specs:
- Background: transparent (inactive) / bg-hover (active)
- Border: 1px solid border-subtle
- Border-radius: 4px
- Padding: 6px 12px
- Font: text-xs, font-medium
```

#### Map Marker
```
Specs:
- Size: 12px diameter
- Border: 2px solid white
- Border-radius: 50%
- Box-shadow: glow based on severity/freshness
- Hover: scale(1.2), z-index boost
```

---

## Mobile Design

### Bottom Navigation
```
┌─────────────────────────────────────┐
│ [Feed] [Map] [Analysis] [Reports] ☰ │
└─────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────┐
│ Gulf Watch    🟢 Live 2m    │ ← Header
├─────────────────────────────┤
│                             │
│    [Map Preview]            │
│    (collapsible)            │
│                             │
├─────────────────────────────┤
│ 🟡 UAE | Missile intercept  │ ← Feed
│ 🔴 Israel | Airstrike conf  │
│ 🟡 Qatar | Drone activity   │
│                             │
├─────────────────────────────┤
│     [Filters]               │ ← Bottom sheet trigger
└─────────────────────────────┘
```

### Mobile Interactions
- Swipe up on feed → Expand
- Tap incident → Slide-over detail view
- Bottom sheet → Filters
- Pinch → Map zoom

---

## Feature Integration Map

### Events Layer
| Feature | Status | Integration |
|---------|--------|-------------|
| RSS Aggregation | ✅ | GitHub Actions, 73 sources |
| Circuit Breaker | ✅ | Deduplication, 92% threshold |
| Cross-Source Verification | ✅ | VERIFIED/LIKELY/PARTIAL badges |
| Severity Scoring | ✅ | Government + keyword scoring |
| Event Type Classification | ✅ | Missile, drone, airstrike, etc. |
| AI Summarization | ⏳ | GPT integration pending |
| User Reports | ✅ | Report button, 5-flag auto-hide |
| WebSocket Updates | ⏳ | Real-time push pending |

### Geography Layer
| Feature | Status | Integration |
|---------|--------|-------------|
| Map Visualization | ✅ | Leaflet + CARTO tiles |
| Coordinate Extractor | ✅ | 50+ cities, all events have coords |
| Coordinate Display | ✅ | Lat/lng on cards and panel |
| Airspace Tracking | ✅ | NOTAMs (sample data) |
| Ballistic Trajectory | 🔮 | Future - trajectory lines |
| Troop Movements | 🔮 | Future - position markers |

### Analysis Layer
| Feature | Status | Integration |
|---------|--------|-------------|
| Finance Panel | ✅ | Oil, Gold, live prices |
| Casualty Tracking | ✅ | Extraction from titles |
| Historical Timeline | ⏳ | Time-series visualization |
| Country Heat Maps | 🔮 | Choropleth layer |
| Predictive Analytics | 🔮 | Future - ML models |
| Source Reliability | ✅ | Govt 95%, News 75%, etc. |

### Data Layer
| Feature | Status | Integration |
|---------|--------|-------------|
| API (feed.json) | ✅ | Machine-readable JSON |
| CSV Export | ✅ | Download functionality |
| GeoJSON Export | ✅ | Mapping tools support |
| RSS Feeds | ✅ | 73 source feeds |
| llms.txt | ✅ | AI crawler documentation |
| Multi-language | 🔮 | Arabic, English, etc. |
| Premium Tier | 🔮 | Future - API keys, rate limits |

---

## Animation & Motion

### Micro-interactions
```css
/* New incident slide-in */
@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slideIn 0.3s ease-out;

/* Map marker pulse */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,68,68,0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255,68,68,0); }
}
animation: pulse 2s infinite;

/* Card hover */
transition: background-color 0.15s ease, border-color 0.15s ease;

/* Loading shimmer */
background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

---

## Implementation Priority

### Phase 1: Foundation (Complete ✅)
- [x] RSS aggregation (73 sources)
- [x] Map visualization with coordinates
- [x] Circuit breaker deduplication
- [x] Cross-source verification badges
- [x] Finance panel
- [x] Regional stats panel

### Phase 2: Core Intelligence (In Progress)
- [x] Event type classification
- [x] Casualty tracking
- [x] Airspace tracking (sample data)
- [ ] AI summarization
- [ ] Historical timeline visualization
- [ ] Confidence scoring algorithm refinement

### Phase 3: Advanced Analytics (Future)
- [ ] Predictive analytics
- [ ] Ballistic trajectory visualization
- [ ] Troop movement monitoring
- [ ] Social media monitoring
- [ ] Satellite imagery integration

### Phase 4: Scale & Premium (Future)
- [ ] WebSocket live updates
- [ ] Mobile applications
- [ ] Multi-language support
- [ ] Premium API tier
- [ ] Team collaboration features

---

## Design Principles Checklist

- [x] Dark tactical interface
- [x] High contrast severity colors
- [x] Compact data cards
- [x] Minimal clutter
- [x] Clear map markers
- [x] Smooth live updates (planned)
- [x] Strong information hierarchy
- [x] Consistent layout system
- [x] Modular architecture
- [x] Scalable for future layers

**Design Goal Achieved:** When a user opens Gulf Watch they instantly understand where something is happening, what just happened, and what it means.

---

## File Structure

```
gulfwatch-testing/
├── public/
│   ├── index.html              # Main app shell
│   ├── css/
│   │   ├── design-system.css   # Variables, base styles
│   │   ├── components.css      # Card, marker, chip styles
│   │   ├── layout.css          # Grid, flex layouts
│   │   └── responsive.css      # Mobile breakpoints
│   ├── js/
│   │   ├── app.js              # Main application logic
│   │   ├── map.js              # Map visualization
│   │   ├── feed.js             # Incident feed
│   │   ├── filters.js          # Filter logic
│   │   └── api.js              # Data fetching
│   └── assets/
│       └── icons/              # Severity, type icons
├── sections/
│   ├── monitor.html            # Monitor section template
│   ├── map.html                # Map section template
│   ├── analysis.html           # Analysis dashboard
│   ├── data.html               # Data interface
│   └── reports.html            # Reports interface
└── DESIGN.md                   # This document
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-14*  
*Status: Architecture Complete - Ready for Implementation*
