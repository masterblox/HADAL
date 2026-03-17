import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { useC2Type } from '@/hooks/useC2Type'
import { WeaponIcon } from './WeaponIcon'
import { thaadSites } from '@/data/thaad-sites'

interface Bar { l: string; w: number; v: string }

interface MissileCardProps {
  country: string
  src: string
  val: number
  valStr?: string
  label: string
  bars?: Bar[]
  chip?: string
  warn?: boolean
  icon: 'ballistic' | 'drone' | 'cruise' | 'intercept' | 'radar'
  index: number
}

export function MissileCard({ country, src, val, valStr, label, bars, chip, warn, icon, index }: MissileCardProps) {
  const noiseRef = useNoiseCanvas({ grayscale: false, interval: 80 })
  const display = useC2Type(val, 600 + index * 280)

  return (
    <div className="mc">
      <canvas ref={noiseRef} className="mc-noise" width={200} height={320} />
      <div className="wtype-icon"><WeaponIcon type={icon} /></div>
      <div className="mc-inner" style={{paddingRight:'32px'}}>
        <div className="MCC">{country}<span className="MCS">{src}</span></div>
        <div className={`MC-BIG${warn ? ' warn' : ''}`}>
          {valStr ?? display}
        </div>
        <div className="MC-BIGL">{label}</div>
        {bars && (
          <div className="mc-bk">
            {bars.map(b => (
              <div key={b.l} className="mc-br">
                <span className="mc-brl">{b.l}</span>
                <div className="mc-sbar"><div className="mc-sfill" style={{width:`${b.w}%`}} /></div>
                <span className="mc-brv">{b.v}</span>
              </div>
            ))}
          </div>
        )}
        {chip && <span className="CHIP C-WARN">{chip}</span>}
        {warn && (
          <div style={{marginTop:'8px'}}>
            {thaadSites.map(s => (
              <div key={s.label} className="tsite">
                <span className="ts-k" style={{fontSize:'var(--fs-micro)'}}>{s.label.split(' ').slice(-1)[0] === 'MUWAFFAQ' ? 'MUWAFFAQ' : s.label.replace('JORDAN ','').replace('QATAR ','').replace('SAUDI ','')}</span>
                <span className="ts-w">{s.status === 'DESTROYED' ? 'DESTR.' : s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
