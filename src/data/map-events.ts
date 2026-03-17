export interface MapEvent {
  type: 'missile' | 'airstrike' | 'intercept' | 'ground' | 'combatant' | 'diplomatic'
  lat: number
  lon: number
  title: string
  detail: string
  conf?: number
  src?: string
  time?: string
}

export const missileEvents: MapEvent[] = [
  {type:'missile',lat:25.2048,lon:55.2708,title:'UAE · DUBAI THEATRE',detail:'165 ballistic · 2 cruise · 541 drones · 35 territory impacts',conf:91,src:'UAE MoD',time:'Feb 28 – Mar 10'},
  {type:'missile',lat:29.3117,lon:47.4818,title:'KUWAIT · MAIN THEATRE',detail:'97 ballistic + 283 drones intercepted',conf:88,src:'KWT MoD',time:'Feb 28 – Mar 10'},
  {type:'missile',lat:25.2854,lon:51.1337,title:'QATAR · UMM DAHAL',detail:'UEWR radar $1.1B destroyed Mar 3 · 18 engaged',conf:90,src:'QTR MoD',time:'Mar 3'},
  {type:'missile',lat:26.0667,lon:50.5577,title:'BAHRAIN · 5TH FLEET HQ',detail:'5th Fleet HQ partially hit · 45 ballistic + 9 drones',conf:85,src:'CENTCOM',time:'Mar 4–7'},
  {type:'missile',lat:32.5568,lon:37.9653,title:'JORDAN · MUWAFFAQ SALTI',detail:'THAAD battery DESTROYED · SAT confirmed',conf:92,src:'SAT',time:'Mar 2'},
  {type:'missile',lat:24.0895,lon:52.6177,title:'UAE · RUWAIS THAAD',detail:'THAAD node hit — radar coverage degraded',conf:87,src:'SAT',time:'Mar 1'},
]

export const interceptEvents: MapEvent[] = [
  {type:'intercept',lat:24.4539,lon:54.3773,title:'UAE · ABU DHABI PATRIOT',detail:'PAC-3 engagement · 94% intercept rate',conf:94,src:'UAE MoD',time:'Mar 8'},
  {type:'intercept',lat:25.0657,lon:55.1713,title:'UAE · DUBAI CORRIDOR',detail:'Integrated AD engagement · 180+ rounds',conf:91,src:'UAE MoD',time:'Mar 5–9'},
  {type:'intercept',lat:29.3679,lon:47.9808,title:'KUWAIT · PATRIOT',detail:'Complete intercept · 0 ground impacts',conf:96,src:'KWT MoD',time:'Mar 7'},
]

export const airstrikeEvents: MapEvent[] = [
  {type:'airstrike',lat:32.4,lon:48.8,title:'IRGC · KHORRAMSHAR LAUNCH',detail:'Shahab-3 / Fattah-2 confirmed launch site',conf:91,src:'SAT',time:'–2h'},
  {type:'airstrike',lat:36.28,lon:59.6,title:'NE IRAN · KHORASAN COMPLEX',detail:'3 ballistic salvos confirmed from NE complex',conf:88,src:'SAT',time:'–4h'},
  {type:'airstrike',lat:15.35,lon:44.2,title:'HOUTHI · SANAA SECTOR',detail:'Drone + anti-ship missile staging active',conf:83,src:'UKMO',time:'–1h'},
  {type:'airstrike',lat:33.3,lon:44.4,title:'IRAQ · PMF CORRIDOR',detail:'Proxy drone staging confirmed · western Iraq',conf:79,src:'OSINT',time:'–3h'},
  {type:'airstrike',lat:23.6,lon:38.5,title:'RED SEA · COMMERCIAL SHIPPING',detail:'Houthi anti-ship missile attack corridor',conf:80,src:'UKMO',time:'–5h'},
  {type:'airstrike',lat:31.5,lon:34.8,title:'ISRAEL · IRON DOME',detail:'Multi-axis drone + missile intercept',conf:89,src:'IDF',time:'Mar 9'},
]

export const groundEvents: MapEvent[] = [
  {type:'ground',lat:24.43,lon:54.65,title:'AL DHAFRA AB · UAE · F-35 + B-52',detail:'USAF fwd operating, active CAP'},
  {type:'ground',lat:25.12,lon:55.37,title:'AL MINHAD AB · UAE · F-16',detail:'UAE + US joint CAP missions'},
  {type:'ground',lat:25.12,lon:51.31,title:'AL UDEID · QATAR · CENTCOM FWD',detail:'E-8 JSTARS active, CENTCOM HQ operations'},
  {type:'ground',lat:24.06,lon:47.58,title:'PRINCE SULTAN AB · KSA',detail:'THAAD + F-15, smoke reported Mar 7'},
  {type:'ground',lat:31.34,lon:36.14,title:'AL ASRAK AB · JORDAN · RJAF',detail:'USAF + RJAF, active CAP post-THAAD loss'},
  {type:'ground',lat:26.19,lon:50.59,title:'NSA BAHRAIN · 5TH FLEET',detail:'Degraded post-strike, fwd operational'},
  {type:'ground',lat:22.8,lon:57.5,title:'MASIRAH AB · OMAN',detail:'Logistics + ISR support base'},
  {type:'ground',lat:29.54,lon:34.95,title:'AQABA SECTOR · RED SEA',detail:'Naval approach corridor, CSG9 staging'},
  {type:'ground',lat:30.0,lon:31.2,title:'EGYPT · SUEZ APPROACH',detail:'Egyptian AD elevated posture'},
  {type:'ground',lat:38.6,lon:34.8,title:'TURKEY · INCIRLIK AB',detail:'NATO ISR elevated alert'},
  {type:'ground',lat:32.8,lon:35.0,title:'ISRAEL · NEVATIM AB',detail:'IDF strategic bomber alert'},
  {type:'ground',lat:25.7,lon:32.2,title:'EGYPT · CAIRO WEST',detail:'Egyptian AF elevated readiness'},
  {type:'ground',lat:24.2,lon:23.4,title:'EGYPT · SOUTH',detail:'Egyptian ground forces southwestern sector'},
  {type:'ground',lat:15.3,lon:44.2,title:'YEMEN · HOUTHI TERRITORY',detail:'IRGC proxy force confirmed active'},
]

export const combatantEvents: MapEvent[] = [
  {type:'combatant',lat:24.5,lon:57.5,title:'USS CVN-71 THEODORE ROOSEVELT',detail:'CSG9 · F/A-18 armed · Arabian Sea · active CAP'},
  {type:'combatant',lat:26.19,lon:50.59,title:'NAVCENT / 5TH FLEET HQ',detail:'NSA Bahrain · partially operational · degraded post-strike'},
  {type:'combatant',lat:23.5,lon:60.2,title:'USS BATAAN (ARG)',detail:'Amphibious Ready Group · Gulf of Oman'},
  {type:'combatant',lat:32.0,lon:34.5,title:'IDF NAVAL · MEDITERRANEAN',detail:'Israeli Navy elevated posture'},
  {type:'combatant',lat:38.0,lon:20.0,title:'HMS QUEEN ELIZABETH',detail:'Royal Navy CSG · Eastern Mediterranean'},
  {type:'combatant',lat:36.5,lon:2.5,title:'USS HARRY S TRUMAN',detail:'CSG8 · Western Mediterranean / transit'},
  {type:'combatant',lat:43.5,lon:12.0,title:'USS MOUNT WHITNEY',detail:'6th Fleet command ship'},
]

export const diplomaticEvents: MapEvent[] = [
  {type:'diplomatic',lat:51.5,lon:-0.1,title:'UK — LONDON HQ',detail:'FCDO crisis meeting · diplomatic deconfliction active'},
  {type:'diplomatic',lat:2.35,lon:48.85,title:'FRANCE — PARIS',detail:'Elysée crisis cell active · ME envoy deployed'},
  {type:'diplomatic',lat:-77.0,lon:38.9,title:'USA — WASHINGTON DC',detail:'NSC emergency session · DEFCON watch elevated'},
  {type:'diplomatic',lat:37.6,lon:55.75,title:'RUSSIA — MOSCOW',detail:'MFA briefing UNSC members · opposing sanctions'},
]

export const iwlFeedSeed = [
  {title:'IRGC: 1-TONNE WARHEAD MISSILES · MORE VECTORS DEPLOYING',type:'missile',detail:'IRGC rejects US missile programme destroyed claim',conf:95,time:'07:44'},
  {title:'HEGSETH: TODAY MOST INTENSE STRIKE DAY — DAY 10 OP. EPIC FURY',type:'airstrike',detail:'US SecDef announces peak escalation',conf:99,time:'06:15'},
  {title:'TRUMP: HIT 20X HARDER IF HORMUZ BLOCKED · WAR ENDS SOON',type:'diplomatic',detail:'Direct presidential threat on Strait of Hormuz',conf:99,time:'05:30'},
  {title:'CENTCOM: IRAN BALLISTIC ATTACKS -90% LAST 24HRS',type:'intercept',detail:'Adm. Cooper confirms significant IRGC degradation',conf:94,time:'04:55'},
  {title:'MOJTABA KHAMENEI NAMED SUPREME LEADER · IRGC HARDLINER',type:'diplomatic',detail:'Confirmed new Supreme Leader — IRGC loyalist',conf:92,time:'03:22'},
  {title:'AMAZON AWS BAHRAIN + 2 UAE FACILITIES OFFLINE · DRONE STRIKES',type:'airstrike',detail:'AWS health dashboard: all facilities remain down',conf:96,time:'Mar 9 22:10'},
  {title:'IRAN: 1,100+ CIVILIAN DEATHS CONFIRMED · HIGHER POSSIBLE',type:'missile',detail:'US-based human rights group · IRNA: 1,230+',conf:88,time:'Mar 9'},
  {title:'40 KILLED IN TEHRAN · CONTINUED US-ISRAEL STRIKES TODAY',type:'airstrike',detail:'Al Jazeera live blog Mar 10 confirmed',conf:91,time:'Mar 10 04:12'},
  {title:'STRAIT OF HORMUZ EFFECTIVELY CLOSED · TANKER RATES +94%',type:'missile',detail:'VLCC benchmark $423,736/day — record high',conf:97,time:'Mar 8'},
  {title:'BRENT CRUDE: $107+ PER BARREL · FIRST TIME IN 4 YEARS',type:'diplomatic',detail:'Chicago CME · +16.5% from Friday close $92',conf:85,time:'Mar 8'},
  {title:'RUSSIA FEEDING IRAN INTEL ON US WARSHIP POSITIONS',type:'diplomatic',detail:'Defence News / Def.Asia sources confirmed',conf:82,time:'Mar 9'},
  {title:'OP. EPIC FURY · DAY 10 · WAR COST EST. $155M/DAY',type:'airstrike',detail:'Brown Univ / NPP cost model · sustained ops phase',conf:80,time:'Mar 10'},
]
