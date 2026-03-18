import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const COUNT = 14000
const SPHERE_RADIUS = 42
const CURSOR_RADIUS = 30
const CURSOR_FORCE = 38.0
const DAMPING = 0.82

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
    const camDir = new THREE.Vector3()
    const pushDir = new THREE.Vector3()
    const swirlDir = new THREE.Vector3()
    const positions: THREE.Vector3[] = []
    const velocities: THREE.Vector3[] = []
    const scales: number[] = []

    // ── Cursor tracking ──
    const mouse3D = new THREE.Vector3(9999, 9999, 0)
    const raycaster = new THREE.Raycaster()
    const cursorPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const ndcMouse = new THREE.Vector2()
    const intersectPt = new THREE.Vector3()

    const onMouseMove = (e: MouseEvent) => {
      ndcMouse.x = (e.clientX / window.innerWidth) * 2 - 1
      ndcMouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(ndcMouse, camera)
      if (raycaster.ray.intersectPlane(cursorPlane, intersectPt)) {
        mouse3D.copy(intersectPt)
      }
    }
    const onMouseLeave = () => { mouse3D.set(9999, 9999, 0) }
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)

    for (let i = 0; i < COUNT; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 180,
      ))
      velocities.push(new THREE.Vector3(0, 0, 0))
      scales.push(0.4 + Math.random() * 1.2)
      instancedMesh.setColorAt(i, color.setHex(0x00ff88))
    }

    // ── Animation ──
    let raf: number

    function animate() {
      raf = requestAnimationFrame(animate)
      controls.update()

      camera.getWorldDirection(camDir)
      cursorPlane.normal.copy(camDir)

      for (let i = 0; i < COUNT; i++) {
        // Fibonacci sphere — ambient orbit
        const phi = Math.acos(-1 + (2 * i) / COUNT)
        const theta = Math.sqrt(COUNT * Math.PI) * phi
        target.set(
          SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi),
          SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi),
          SPHERE_RADIUS * Math.cos(phi),
        )

        // Cursor repulsion — inverse-square magnetic field
        const v = velocities[i]
        const dx = positions[i].x - mouse3D.x
        const dy = positions[i].y - mouse3D.y
        const dz = positions[i].z - mouse3D.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < CURSOR_RADIUS && dist > 0.1) {
          const inv = 1 / dist
          const t = dist / CURSOR_RADIUS
          const smoothT = t * t * (3 - 2 * t)
          const force = (1 - smoothT) * CURSOR_FORCE

          const radialF = inv * force * 0.45

          pushDir.set(dx * inv, dy * inv, dz * inv)
          swirlDir.crossVectors(pushDir, camDir)
          const swirlF = force * 0.1

          v.x += dx * radialF + swirlDir.x * swirlF
          v.y += dy * radialF + swirlDir.y * swirlF
          v.z += dz * radialF + swirlDir.z * swirlF
        }

        // Apply velocity then damp
        positions[i].x += v.x
        positions[i].y += v.y
        positions[i].z += v.z
        v.multiplyScalar(DAMPING)

        // Lerp back to target — scattered particles return slowly
        const dispX = positions[i].x - target.x
        const dispY = positions[i].y - target.y
        const dispZ = positions[i].z - target.z
        const displacement = Math.sqrt(dispX * dispX + dispY * dispY + dispZ * dispZ)
        const lerpRate = displacement > 20 ? 0.008 : displacement > 8 ? 0.025 : 0.05
        positions[i].lerp(target, lerpRate)
        color.setHex(0x00ff88)

        dummy.position.copy(positions[i])
        const s = scales[i]
        dummy.scale.set(s, s, s)
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
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
      controls.dispose()
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="sonar-particles" />
}
