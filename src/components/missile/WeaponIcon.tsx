interface WeaponIconProps {
  type: 'ballistic' | 'drone' | 'cruise' | 'intercept' | 'radar'
}

export function WeaponIcon({ type }: WeaponIconProps) {
  switch (type) {
    case 'ballistic':
      return <div className="ico-ballistic"><div className="ico-ballistic-exhaust" /></div>
    case 'drone':
      return (
        <div className="ico-drone">
          <div className="ico-drone-body" />
          <div className="ico-drone-arm" style={{transform:'rotate(45deg)',left:0}} />
          <div className="ico-drone-arm" style={{transform:'rotate(-45deg)',right:0}} />
          <div className="ico-drone-rotor" style={{top:'1px',left:'1px'}} />
          <div className="ico-drone-rotor" style={{top:'1px',right:'1px'}} />
          <div className="ico-drone-rotor" style={{bottom:'1px',left:'1px'}} />
          <div className="ico-drone-rotor" style={{bottom:'1px',right:'1px'}} />
        </div>
      )
    case 'cruise':
      return (
        <div className="ico-cruise">
          <div className="ico-cruise-body" />
          <div className="ico-cruise-nose" />
          <div className="ico-cruise-wing" />
          <div className="ico-cruise-tail" />
        </div>
      )
    case 'intercept':
      return (
        <div className="ico-intercept">
          <div className="ico-intercept-ring" />
          <div className="ico-intercept-x" />
        </div>
      )
    case 'radar':
      return (
        <div className="ico-radar">
          <div className="ico-radar-dish" />
          <div className="ico-radar-post" />
          <div className="ico-radar-base" />
          <div className="ico-radar-dot" />
        </div>
      )
  }
}
