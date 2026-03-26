import { useEffect, useRef } from 'react'
import { G, G2, AMB, PI, stamp, hdSetup } from '@/canvas/canvasKit'
import { DevTag } from '@/components/shared/DevTag'

const vessels = [
  { mmsi: '211234567', name: 'HORMUZ SPIRIT', type: 'CRUDE', flag: 'IR', sog: 8.2, cog: 142, lat: 26.42, lon: 56.18, gap: 47, anom: 1 },
  { mmsi: '636092148', name: 'GULF PIONEER', type: 'LNG', flag: 'PA', sog: 14.1, cog: 318, lat: 26.55, lon: 56.31, gap: 0, anom: 0 },
  { mmsi: '477321900', name: 'PERSIAN STAR', type: 'CHEM', flag: 'HK', sog: 11.8, cog: 87, lat: 26.38, lon: 56.44, gap: 0, anom: 0 },
  { mmsi: '256412000', name: 'BANDAR TRADER', type: 'BULK', flag: 'MT', sog: 6.4, cog: 205, lat: 26.61, lon: 55.92, gap: 12, anom: 1 },
  { mmsi: '413876500', name: 'QESHM FERRY', type: 'PAX', flag: 'IR', sog: 18.2, cog: 45, lat: 26.48, lon: 56.08, gap: 0, anom: 0 },
  { mmsi: '538006721', name: 'MUSCAT CARGO', type: 'GEN', flag: 'MH', sog: 9.7, cog: 271, lat: 26.33, lon: 56.55, gap: 0, anom: 0 },
  { mmsi: '312045800', name: 'AL DHAFRA', type: 'CRUDE', flag: 'AE', sog: 7.1, cog: 162, lat: 26.71, lon: 55.78, gap: 0, anom: 0 },
  { mmsi: '229341000', name: 'KHOR FAKKAN', type: 'CONT', flag: 'MT', sog: 15.3, cog: 92, lat: 26.25, lon: 56.68, gap: 0, anom: 0 },
  { mmsi: '215432100', name: 'SILENT WIND', type: 'CRUDE', flag: 'IR', sog: 0.3, cog: 0, lat: 26.58, lon: 56.12, gap: 183, anom: 1 },
  { mmsi: '477998300', name: 'JADE HARMONY', type: 'LPG', flag: 'HK', sog: 12.6, cog: 338, lat: 26.44, lon: 56.39, gap: 0, anom: 0 },
]

export function TheatreExchangeTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      x.fillStyle = '#020400'; x.fillRect(0, 0, W, H)
      const t = Date.now() / 1000

      const gx = 6, gy = 52, gw = W * 0.42, gh = H * 0.52
      x.fillStyle = 'rgba(5,7,0,.6)'; x.fillRect(gx, gy, gw, gh)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1; x.strokeRect(gx, gy, gw, gh)
      x.strokeStyle = G2 + '.03)'; x.lineWidth = 0.5
      for (let i = 0; i < 8; i++) { const ly = gy + i * (gh / 7); x.beginPath(); x.moveTo(gx, ly); x.lineTo(gx + gw, ly); x.stroke() }
      for (let i = 0; i < 6; i++) { const lx = gx + i * (gw / 5); x.beginPath(); x.moveTo(lx, gy); x.lineTo(lx, gy + gh); x.stroke() }
      x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.15)'
      x.fillText('56.0E', gx + 4, gy + gh - 3); x.fillText('56.7E', gx + gw - 22, gy + gh - 3)
      x.fillText('26.7N', gx + 2, gy + 10); x.fillText('26.2N', gx + 2, gy + gh - 10)

      vessels.forEach((v, i) => {
        const vx2 = gx + ((v.lon - 55.7) / (56.8 - 55.7)) * gw
        const vy2 = gy + ((26.75 - v.lat) / (26.75 - 26.2)) * gh
        if (vx2 < gx || vx2 > gx + gw || vy2 < gy || vy2 > gy + gh) return
        if (v.anom) {
          x.fillStyle = 'rgba(255,152,20,.6)'; x.fillRect(vx2 - 3, vy2 - 3, 6, 6)
          const pr = Math.sin(t * 3 + i) * 0.15 + 0.2
          x.strokeStyle = 'rgba(255,152,20,' + pr.toFixed(2) + ')'; x.lineWidth = 1
          x.strokeRect(vx2 - 6, vy2 - 6, 12, 12)
        } else {
          x.fillStyle = G2 + '.55)'; x.fillRect(vx2 - 2, vy2 - 2, 4, 4)
        }
        const rad = v.cog * PI / 180
        if (v.sog > 0.5) {
          x.strokeStyle = v.anom ? 'rgba(255,152,20,.25)' : G2 + '.15)'; x.lineWidth = 0.5
          x.beginPath(); x.moveTo(vx2, vy2); x.lineTo(vx2 + Math.sin(rad) * 12, vy2 - Math.cos(rad) * 12); x.stroke()
        }
      })

      x.font = '6px "Teko"'; x.fillStyle = G2 + '.35)'; x.fillText('STRAIT OF HORMUZ — AIS COVERAGE', gx + 4, gy - 3)

      const tx = W * 0.46, tw = W * 0.52, ty = 52
      x.fillStyle = 'rgba(5,7,0,.85)'; x.fillRect(tx, ty, tw, H - 80)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(tx, ty, tw, H - 80)
      x.fillStyle = G2 + '.15)'; x.fillRect(tx, ty, tw, 3)
      x.fillStyle = G2 + '.04)'; x.fillRect(tx + 2, ty + 6, tw - 4, 12)
      x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'
      ;[['MMSI', 0], ['NAME', 52], ['TYPE', 108], ['SOG', 132], ['COG', 152], ['GAP', 172]].forEach(([label, cx]) => x.fillText(label as string, tx + 6 + (cx as number), ty + 15))

      const selRow = Math.floor(t * 0.6) % vessels.length
      vessels.forEach((v, i) => {
        const ry = ty + 22 + i * 14; if (ry > H - 34) return
        const isSel = i === selRow
        if (isSel) { x.fillStyle = G2 + '.04)'; x.fillRect(tx + 2, ry - 2, tw - 4, 13); x.strokeStyle = G2 + '.1)'; x.lineWidth = 0.5; x.strokeRect(tx + 2, ry - 2, tw - 4, 13) }
        if (v.anom) { x.fillStyle = 'rgba(255,152,20,.02)'; x.fillRect(tx + 2, ry - 2, tw - 4, 13) }
        x.font = '4px "Share Tech Mono"'
        x.fillStyle = isSel ? G2 + '.6)' : G2 + '.3)'; x.fillText(v.mmsi.slice(-6), tx + 6, ry + 8)
        x.fillStyle = isSel ? G : G2 + '.45)'; x.fillText(v.name.slice(0, 12), tx + 58, ry + 8)
        x.fillStyle = G2 + '.25)'; x.fillText(v.type, tx + 114, ry + 8)
        x.fillStyle = G2 + '.35)'; x.fillText(v.sog.toFixed(1), tx + 138, ry + 8)
        x.fillText(v.cog + '°', tx + 158, ry + 8)
        if (v.gap > 0) { x.fillStyle = v.gap > 30 ? AMB : 'rgba(255,152,20,.5)'; x.fillText(v.gap + 'm', tx + 178, ry + 8) }
        else { x.fillStyle = G2 + '.12)'; x.fillText('—', tx + 178, ry + 8) }
      })

      const sy = gy + gh + 8, sh = H - sy - 34
      x.fillStyle = 'rgba(5,7,0,.75)'; x.fillRect(gx, sy, gw, sh)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1; x.strokeRect(gx, sy, gw, sh)
      x.font = '5px "Teko"'; x.fillStyle = G2 + '.3)'; x.fillText('AIS GAP TIMELINE — LAST 6H', gx + 4, sy + 12)
      const gapVessels = vessels.filter(v => v.gap > 0)
      gapVessels.forEach((v, i) => {
        const by = sy + 20 + i * 22; if (by + 16 > sy + sh) return
        x.font = '4px "Share Tech Mono"'; x.fillStyle = AMB; x.fillText(v.name.slice(0, 14), gx + 4, by + 6)
        const barW = Math.min(gw - 12, (v.gap / 200) * (gw - 12))
        x.fillStyle = 'rgba(255,152,20,.08)'; x.fillRect(gx + 4, by + 9, gw - 12, 6)
        x.fillStyle = 'rgba(255,152,20,.45)'; x.fillRect(gx + 4, by + 9, barW, 6)
        if (v.gap > 30) { const fl = Math.sin(t * 2 + i) * 0.15 + 0.25; x.fillStyle = 'rgba(255,152,20,' + fl.toFixed(2) + ')'; x.fillRect(gx + 4 + barW - 2, by + 9, 4, 6) }
        x.font = '4px "Share Tech Mono"'; x.fillStyle = 'rgba(255,152,20,.35)'; x.fillText(v.gap + 'MIN', gx + gw - 28, by + 6)
      })

      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'
      x.fillText(vessels.length + ' TRACKS · ' + gapVessels.length + ' GAPS · HORMUZ SECTOR', tx + 6, H - 34)

      stamp(x, 4, H - 28, 'SYS:AIS-TRK')
      rafId = requestAnimationFrame(draw)
    }
    document.fonts.ready.then(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <DevTag id="A.11" />
    </div>
  )
}
