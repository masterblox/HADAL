export function rhChart(pts: number[], up: boolean, W: number, H: number): string {
  const mn = Math.min(...pts) - 2, mx = Math.max(...pts) + 2, rng = mx - mn
  const xs = pts.map((_p, i) => i * (W / (pts.length - 1)))
  const ys = pts.map(p => H - 2 - ((p - mn) / rng) * (H - 8))
  let d = `M${xs[0]},${ys[0]}`
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2
    d += ` C${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`
  }
  const col = up ? 'rgba(255,160,30,.85)' : 'rgba(255,90,20,.8)'
  const fillCol = up ? 'rgba(255,160,30,' : 'rgba(255,90,20,'
  const areaD = d + ` L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`
  const gradId = 'g' + Math.random().toString(36).slice(2)
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${fillCol}.15)"/><stop offset="100%" stop-color="${fillCol}0)"/></linearGradient></defs><path d="${areaD}" fill="url(#${gradId})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.5"/></svg>`
}

export function genSparkline(base: number, len: number): number[] {
  const pts: number[] = []
  let v = base * .92
  for (let i = 0; i < len; i++) {
    v += ((base - v) * .15) + (Math.random() - .4) * (base * .02)
    pts.push(v)
  }
  pts[len - 1] = base
  return pts
}
