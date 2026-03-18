import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const COUNT = 8000
const SPHERE_RADIUS = 30

export function SonarParticles() {
  const mountRef = useRef<HTMLDivElement>(null)

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
    controls.autoRotateSpeed = 1.2
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

    // ── Init positions ──
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    const target = new THREE.Vector3()
    const positions: THREE.Vector3[] = []

    for (let i = 0; i < COUNT; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 180,
      ))
      instancedMesh.setColorAt(i, color.setHex(0x00ff88))
    }

    // ── Animation ──
    let raf: number

    function animate() {
      raf = requestAnimationFrame(animate)
      controls.update()

      for (let i = 0; i < COUNT; i++) {
        // Fibonacci sphere — ambient orbit
        const phi = Math.acos(-1 + (2 * i) / COUNT)
        const theta = Math.sqrt(COUNT * Math.PI) * phi
        target.set(
          SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi),
          SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi),
          SPHERE_RADIUS * Math.cos(phi),
        )
        positions[i].lerp(target, 0.05)
        color.setHex(0x00ff88)

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
}
