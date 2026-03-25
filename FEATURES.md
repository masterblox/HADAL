# HADAL Feature Matrix

Active build note:
- `ACTIVE NOW` = GulfWatch V2 correction pass
- `substatus` = overview hero restored / maps renamed / console workbench retained / gate removed
- `canonical product` = GulfWatch V2
- `donor only` = AYN / HADAL experiment branches

Migration truth order:
- `repo truth` = handoff docs + current `main`
- `live truth` = deploy parity check against repo truth
- `historical docs` = README + extraction plan, reference only

Tranche 1 lock:
- `goal` = parity-and-landing pass only
- `lane model` = Overview / Maps / Console
- `do now` = live parity check / Overview hero sizing correction / preserve Maps naming / preserve gate removal
- `do later` = donor extraction, new platform systems, cross-lane redesigns

Feature buckets:
- `canonical` = supports locked GulfWatch V2 direction
- `donor-only` = AYN / MIT patterns not adopted into current product truth
- `legacy` = older lineage references, not active direction
- `discard` = empty shells, fake-fill surfaces, banned architecture regressions

Status legend:
- `🟢` = new updates carried forward into GulfWatch V2
- `⚪` = older/legacy Gulf Watch/HADAL lineage
- `❌` = empty shell, invalid, or currently useless in latest commit

Core feature list:
- ⚪ Monitor
- ⚪ Map
- ⚪ Analysis
- ⚪ Prediction
- ❌ Military Signals
- ❌ Venus Trap
- 🟢 Argus (Entity Resolution & Threat Intelligence)
- 🟢 Chatter (Social Media & News Intelligence)
- 🟢 Ignite (NASA FIRMS Thermal Detection)
- 🟢 Chronos (Temporal Change Detection)
- 🟢 Skyline (Weather Intelligence for Operations)
- ❌ Data
- ❌ Reports
- ⚪ Airspace
- ❌ Maritime (AIS direction/surface)
- ⚪ Satellites
- ⚪ ADS-B Aircraft Tracking
- 🟢 Event / Signal / Entity / Relationship model
- ❌ Confidence explanation layer
- ❌ Cross-source verification
- ❌ Real-time signal ingestion layer
- ❌ WebSocket/streaming direction
- ❌ Mini-services architecture
