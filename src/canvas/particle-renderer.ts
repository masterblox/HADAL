// Shared Three.js particle renderer — uses r128 from CDN
// Three.js is loaded as a global script; this module reads from window.THREE

import { loadPly } from './ply-loader'

declare global {
  interface Window {
    THREE: typeof import('three')
  }
}

export interface ParticleConfig {
  container: HTMLElement
  size: number
  opacity: number
  rotation?: { axis: 'x' | 'y' | 'z'; speed: number }
  drift?: { enabled: boolean; amplitude: number; frequency: number }
  width?: number
  height?: number
  background?: number
  backgroundAlpha?: number
}

export interface ParticleInstance {
  start: () => void
  stop: () => void
  dispose: () => void
  getPoints: () => any
  setOpacity: (v: number) => void
}

let threeLoaded: Promise<void> | null = null

function ensureThree(): Promise<void> {
  if (window.THREE) return Promise.resolve()
  if (threeLoaded) return threeLoaded
  threeLoaded = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Three.js'))
    document.head.appendChild(s)
  })
  return threeLoaded
}

export async function createParticleRenderer(config: ParticleConfig): Promise<ParticleInstance> {
  await ensureThree()
  const data = await loadPly()
  const THREE = window.THREE

  const w = config.width ?? config.container.clientWidth
  const h = config.height ?? config.container.clientHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000)
  camera.position.z = 200

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  if (config.backgroundAlpha !== undefined) {
    renderer.setClearColor(config.background ?? 0x000000, config.backgroundAlpha)
  } else {
    renderer.setClearColor(0x000000, 0)
  }
  renderer.domElement.style.pointerEvents = 'none'
  config.container.appendChild(renderer.domElement)

  // Build geometry
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))

  // Encode per-vertex opacity into vertex colors (RGB * alpha)
  const vertexColors = new Float32Array(data.count * 3)
  for (let i = 0; i < data.count; i++) {
    const a = data.colors[i * 4 + 3] * config.opacity
    vertexColors[i * 3] = data.colors[i * 4] * a
    vertexColors[i * 3 + 1] = data.colors[i * 4 + 1] * a
    vertexColors[i * 3 + 2] = data.colors[i * 4 + 2] * a
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3))

  const material = new THREE.PointsMaterial({
    size: config.size,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  let raf = 0
  let running = false

  function animate() {
    if (!running) return
    raf = requestAnimationFrame(animate)

    if (config.rotation) {
      const axis = config.rotation.axis
      points.rotation[axis] += config.rotation.speed
    }

    if (config.drift?.enabled) {
      const t = Date.now() / 1000
      const posArr = geometry.attributes.position.array as Float32Array
      const origPositions = data.positions
      for (let i = 0; i < data.count; i++) {
        const ox = origPositions[i * 3]
        const oy = origPositions[i * 3 + 1]
        const oz = origPositions[i * 3 + 2]
        const phase = ox * 0.01 + oy * 0.01 + oz * 0.01
        posArr[i * 3] = ox + Math.sin(t * config.drift!.frequency + phase) * config.drift!.amplitude
        posArr[i * 3 + 1] = oy + Math.cos(t * config.drift!.frequency * 0.7 + phase * 1.3) * config.drift!.amplitude * 0.6
        posArr[i * 3 + 2] = oz + Math.sin(t * config.drift!.frequency * 0.5 + phase * 0.8) * config.drift!.amplitude * 0.4
      }
      geometry.attributes.position.needsUpdate = true
    }

    renderer.render(scene, camera)
  }

  return {
    start() { running = true; animate() },
    stop() { running = false; cancelAnimationFrame(raf) },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    },
    getPoints() { return points },
    setOpacity(v: number) {
      // Rebuild vertex colors with new opacity multiplier
      for (let i = 0; i < data.count; i++) {
        const a = data.colors[i * 4 + 3] * v
        vertexColors[i * 3] = data.colors[i * 4] * a
        vertexColors[i * 3 + 1] = data.colors[i * 4 + 1] * a
        vertexColors[i * 3 + 2] = data.colors[i * 4 + 2] * a
      }
      geometry.attributes.color.needsUpdate = true
    },
  }
}
