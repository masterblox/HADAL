/** Simulated Gulf-theatre flight tracks for the Flight Tracker section */

export interface DemoFlight {
  callsign: string
  type: 'commercial' | 'military' | 'cargo' | 'surveillance'
  aircraft: string
  lat: number
  lng: number
  alt: number        // FL (flight level × 100 ft)
  speed: number      // knots
  heading: number    // degrees
  squawk: string
  origin: string
  dest: string
}

export const demoFlights: DemoFlight[] = [
  // Commercial
  { callsign: 'UAE231',  type: 'commercial',   aircraft: 'A380',  lat: 25.41, lng: 54.02, alt: 380, speed: 498, heading: 315, squawk: '2341', origin: 'OMDB', dest: 'EGLL' },
  { callsign: 'QTR8',   type: 'commercial',   aircraft: 'B77W',  lat: 26.12, lng: 50.88, alt: 350, speed: 512, heading: 280, squawk: '4721', origin: 'OTHH', dest: 'KJFK' },
  { callsign: 'GFA214', type: 'commercial',   aircraft: 'A321',  lat: 26.05, lng: 50.52, alt: 310, speed: 445, heading: 42,  squawk: '3210', origin: 'OBBI', dest: 'OERK' },
  { callsign: 'KAC513', type: 'commercial',   aircraft: 'B738',  lat: 29.18, lng: 47.92, alt: 404, speed: 496, heading: 195, squawk: '1204', origin: 'OKBK', dest: 'OMDB' },
  { callsign: 'SVA42',  type: 'commercial',   aircraft: 'B789',  lat: 24.68, lng: 46.71, alt: 390, speed: 502, heading: 65,  squawk: '5102', origin: 'OEJN', dest: 'VIDP' },
  { callsign: 'OMA643', type: 'commercial',   aircraft: 'B738',  lat: 23.58, lng: 58.23, alt: 280, speed: 410, heading: 310, squawk: '6340', origin: 'OOMS', dest: 'OBBI' },
  { callsign: 'IAW116', type: 'commercial',   aircraft: 'A320',  lat: 33.21, lng: 44.19, alt: 340, speed: 462, heading: 170, squawk: '2100', origin: 'ORBI', dest: 'OTHH' },

  // Military
  { callsign: 'VIPER01', type: 'military',    aircraft: 'F-15E', lat: 28.39, lng: 45.10, alt: 250, speed: 540, heading: 90,  squawk: '7401', origin: 'OEPS', dest: 'CAP' },
  { callsign: 'FURY77',  type: 'military',    aircraft: 'F/A-18',lat: 26.80, lng: 52.10, alt: 220, speed: 510, heading: 45,  squawk: '7402', origin: 'CVN-77', dest: 'CAP' },
  { callsign: 'DOOM22',  type: 'military',    aircraft: 'F-35A', lat: 24.42, lng: 54.62, alt: 310, speed: 585, heading: 355, squawk: '7403', origin: 'OMAD', dest: 'CAP' },
  { callsign: 'TORCH6',  type: 'military',    aircraft: 'KC-135',lat: 27.50, lng: 49.80, alt: 280, speed: 420, heading: 120, squawk: '7410', origin: 'OEPS', dest: 'ORBIT' },
  { callsign: 'SPECTRE', type: 'military',    aircraft: 'B-1B',  lat: 30.10, lng: 43.50, alt: 300, speed: 530, heading: 135, squawk: '7420', origin: 'OEPS', dest: 'STRIKE' },

  // Cargo
  { callsign: 'FDX9201', type: 'cargo',       aircraft: 'B77F',  lat: 25.25, lng: 55.38, alt: 370, speed: 488, heading: 290, squawk: '1441', origin: 'OMDB', dest: 'EDDF' },
  { callsign: 'GTI8732', type: 'cargo',       aircraft: 'B748F', lat: 27.80, lng: 48.60, alt: 360, speed: 475, heading: 240, squawk: '1522', origin: 'OTHH', dest: 'LTFM' },

  // Surveillance
  { callsign: 'RQ4A-07', type: 'surveillance',aircraft: 'RQ-4',  lat: 27.20, lng: 51.40, alt: 550, speed: 310, heading: 180, squawk: '7500', origin: 'CLASSIFIED', dest: 'ORBIT' },
  { callsign: 'SIGINT3', type: 'surveillance',aircraft: 'RC-135',lat: 29.60, lng: 50.20, alt: 340, speed: 380, heading: 70,  squawk: '7501', origin: 'CLASSIFIED', dest: 'ORBIT' },
  { callsign: 'E3-AWACS',type: 'surveillance',aircraft: 'E-3B',  lat: 28.10, lng: 47.30, alt: 290, speed: 360, heading: 210, squawk: '7502', origin: 'OEPS', dest: 'ORBIT' },
]
