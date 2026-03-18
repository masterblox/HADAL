export interface FeedItem {
  id: string
  region: string
  type: string
  sev: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  src: string
  conf: number
  tags: string[]
  live?: boolean
  lat?: number
  lon?: number
  published?: string
}

export const feedData: FeedItem[] = [
  {id:'TH-0048',region:'IRAN',type:'IRGC: DEPLOYING 1-TONNE WARHEAD MISSILES · MORE THAN BEFORE',sev:'CRITICAL',src:'IRGC',conf:95,tags:['IRAN']},
  {id:'TH-0047',region:'GULF',type:'HEGSETH: TUESDAY MOST INTENSE STRIKE DAY — GULF THEATRE',sev:'CRITICAL',src:'DoD',conf:99,tags:['GULF']},
  {id:'TH-0046',region:'GULF',type:'TRUMP: HIT IRAN 20X HARDER IF HORMUZ BLOCKED — DIRECT THREAT',sev:'CRITICAL',src:'WH',conf:99,tags:['GULF']},
  {id:'TH-0045',region:'IRAN',type:'CENTCOM: IRAN BALLISTIC ATTACKS -90% LAST 24HRS',sev:'HIGH',src:'CENTCOM',conf:94,tags:['IRAN']},
  {id:'TH-0044',region:'IRAN',type:'MOJTABA KHAMENEI NAMED SUPREME LEADER · IRGC HARDLINER',sev:'HIGH',src:'IRNA',conf:92,tags:['IRAN']},
  {id:'TH-0043',region:'BAHRAIN',type:'AMAZON AWS BAHRAIN DATA CENTER OFFLINE · DRONE STRIKE',sev:'HIGH',src:'AWS',conf:96,tags:['GULF']},
  {id:'TH-0042',region:'UAE',type:'BALLISTIC SALVO · TEHRAN ORIGIN · MULTI-WARHEAD',sev:'CRITICAL',src:'MoD',conf:94,tags:['UAE']},
  {id:'TH-0041',region:'JORDAN',type:'THAAD BATTERY DESTROYED · MUWAFFAQ SALTI AB',sev:'CRITICAL',src:'SAT',conf:92,tags:['GULF']},
  {id:'TH-0040',region:'QATAR',type:'UEWR RADAR $1.1B DESTROYED · UMM DAHAL',sev:'CRITICAL',src:'CNN',conf:90,tags:['GULF']},
  {id:'TH-0039',region:'BAHRAIN',type:'5TH FLEET HQ PARTIAL IMPACT · NSA BAHRAIN',sev:'CRITICAL',src:'AP',conf:87,tags:['GULF']},
  {id:'TH-0038',region:'KUWAIT',type:'6 US SOLDIERS KIA · PORT SHUAIBA DRONE ATTACK MAR 1',sev:'CRITICAL',src:'DoD',conf:99,tags:['GULF']},
  {id:'TH-0037',region:'IRAN',type:'IRGC BALLISTIC LAUNCH SIGNATURE · KHORRAMSHAR',sev:'CRITICAL',src:'SAT',conf:91,tags:['IRAN']},
  {id:'TH-0036',region:'RED SEA',type:'HOUTHI DRONE SWARM · COMMERCIAL SHIPPING · HORMUZ CLOSED',sev:'HIGH',src:'UKMO',conf:83,tags:['RED SEA']},
  {id:'TH-0035',region:'ISRAEL',type:'IRON DOME INTERCEPT · CLUSTER WARHEADS CONFIRMED · NORTH',sev:'HIGH',src:'IDF',conf:89,tags:['ISRAEL']},
]
