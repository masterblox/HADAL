// Shared canvas utilities — mirrors the b803809 moodboard helpers
export const G = '#DAFF4A'
export const G2 = 'rgba(218,255,74,'
export const AMB = '#FF9814'
export const BG = '#050700'
export const PI = Math.PI
export const TAU = PI * 2

const _noiseCache = new Map<string, HTMLCanvasElement>()

export function makeNoise(w: number, h: number, density: number): HTMLCanvasElement {
  const key = `${w}x${h}d${density}`
  if (_noiseCache.has(key)) return _noiseCache.get(key)!
  const oc = document.createElement('canvas')
  oc.width = w; oc.height = h
  const ox = oc.getContext('2d')!
  const imgD = ox.createImageData(w, h)
  const d = imgD.data
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random()
    const v = n < density ? 0.06 + n * 2 : 0
    d[i] = Math.floor(218 * v * 0.5)
    d[i + 1] = Math.floor(255 * v)
    d[i + 2] = Math.floor(74 * v * 0.3)
    d[i + 3] = 255
  }
  ox.putImageData(imgD, 0, 0)
  _noiseCache.set(key, oc)
  return oc
}

export function rasterBase(x: CanvasRenderingContext2D, W: number, H: number, density: number, DPR: number) {
  const cached = makeNoise(W * DPR, H * DPR, density)
  x.save()
  x.setTransform(1, 0, 0, 1, 0, 0)
  x.drawImage(cached, 0, 0)
  x.restore()
  x.setTransform(DPR, 0, 0, DPR, 0, 0)
}

export function stamp(x: CanvasRenderingContext2D, sx: number, sy: number, code: string) {
  x.save()
  x.font = '5px "Share Tech Mono"'
  x.fillStyle = G2 + '.12)'
  x.fillText('▪ ' + code, sx, sy)
  x.strokeStyle = G2 + '.06)'
  x.lineWidth = 0.5
  x.strokeRect(sx - 2, sy - 6, code.length * 3.5 + 12, 9)
  x.restore()
}

/** Resize canvas to match its CSS display size. Returns {W, H, x} or null. */
export function hdSetup(cv: HTMLCanvasElement, DPR: number): { W: number; H: number; x: CanvasRenderingContext2D } | null {
  const W = cv.offsetWidth, H = cv.offsetHeight
  if (!W || !H) return null
  cv.width = W * DPR; cv.height = H * DPR
  const x = cv.getContext('2d')
  if (!x) return null
  x.setTransform(DPR, 0, 0, DPR, 0, 0)
  return { W, H, x }
}
