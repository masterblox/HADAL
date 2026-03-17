import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const COUNT = 8000
const SPHERE_RADIUS = 30

export interface SonarParticlesHandle {
  explode: () => void
}

export const SonarParticles = forwardRef<SonarParticlesHandle>(function SonarParticles(_, ref) {
  const mountRef = useRef<HTMLDivElement>(null)
  const explodeRef = useRef(false)
  const explodeTimeRef = useRef(0)

  useImperativeHandle(ref, () => ({
    explode: () => {
      explodeRef.current = true
      explodeTimeRef.current = 0
    },
  }))

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.01)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.set(0, 0, 100)

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(1) // fixed 1x — biggest perf win
    container.appendChild(renderer.domElement)

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 2.0
    controls.enableZoom = false
    controls.enablePan = false

    // ── Post Processing (Bloom) ──
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    )
    bloomPass.strength = 1.5
    bloomPass.radius = 0.3
    bloomPass.threshold = 0.1
    composer.addPass(bloomPass)

    // ── Instanced Mesh (tetrahedrons) ──
    const geometry = new THREE.TetrahedronGeometry(0.25)
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT)
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(instancedMesh)

    // ── Init positions + velocities ──
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    const target = new THREE.Vector3()
    const positions: THREE.Vector3[] = []
    const velocities: THREE.Vector3[] = []

    for (let i = 0; i < COUNT; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
      ))
      // Pre-compute explosion velocity: outward from sphere surface + random scatter
      const phi = Math.acos(-1 + (2 * i) / COUNT)
      const theta = Math.sqrt(COUNT * Math.PI) * phi
      const nx = Math.cos(theta) * Math.sin(phi)
      const ny = Math.sin(theta) * Math.sin(phi)
      const nz = Math.cos(phi)
      const speed = 1.5 + Math.random() * 3.0
      velocities.push(new THREE.Vector3(
        nx * speed + (Math.random() - 0.5) * 0.8,
        ny * speed + (Math.random() - 0.5) * 0.8,
        nz * speed + (Math.random() - 0.5) * 0.8,
      ))
      instancedMesh.setColorAt(i, color.setHex(0x00ff88))
    }

    // ── Animation ──
    const clock = new THREE.Clock()
    let raf: number

    function animate() {
      raf = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      controls.update()

      const exploding = explodeRef.current

      if (exploding) {
        explodeTimeRef.current += delta

        // Ramp up bloom during explosion
        const t = Math.min(explodeTimeRef.current / 2.0, 1) // 0→1 over 2 seconds
        bloomPass.strength = 1.8 + t * 6 // bloom intensifies
        controls.autoRotateSpeed = 2.0 + t * 20 // spin faster

        // Fog closes in to white-out
        const fogDensity = 0.01 + t * t * 0.08
        scene.fog = new THREE.FogExp2(
          new THREE.Color().setHSL(0.22, 0.8, t * 0.5).getHex(),
          fogDensity
        )
      }

      for (let i = 0; i < COUNT; i++) {
        if (exploding) {
          // Particles fly outward along their velocity
          const t = explodeTimeRef.current
          const vel = velocities[i]
          positions[i].x += vel.x * delta * (40 + t * 30)
          positions[i].y += vel.y * delta * (40 + t * 30)
          positions[i].z += vel.z * delta * (40 + t * 30)

          // Color shifts: green → white → fade
          const fade = Math.min(t / 1.5, 1)
          const lum = 0.4 + fade * 0.6
          const sat = 0.8 * (1 - fade)
          color.setHSL(0.22, sat, lum)
        } else {
          // Normal: Fibonacci sphere
          const phi = Math.acos(-1 + (2 * i) / COUNT)
          const theta = Math.sqrt(COUNT * Math.PI) * phi
          target.set(
            SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi),
            SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi),
            SPHERE_RADIUS * Math.cos(phi),
          )
          positions[i].lerp(target, 0.1)
          color.setHex(0x00ff88)
        }

        dummy.position.copy(positions[i])
        dummy.updateMatrix()
        instancedMesh.setMatrixAt(i, dummy.matrix)
        instancedMesh.setColorAt(i, color)
      }

      instancedMesh.instanceMatrix.needsUpdate = true
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true

      composer.render()
    }

    animate()

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="sonar-particles" />
})
