import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../office3d-layout.ts'

// Embers rising from the campfire: one Points draw call, ~80 particles looping a
// rise + sway + fade lifecycle. Each particle's colour cools from bright orange to
// deep red while its envelope fades; additive blending reads a black colour as
// invisible, so this is a per-particle fade without a custom shader.
// Disabled entirely under prefers-reduced-motion.
const COUNT = 80
const RISE = 2.4
const SWAY = 0.4

export function EmberParticles({ position }: { position: Vec3 }) {
  // Checked once on mount, not per frame.
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const { baseX, baseZ, speed, phase, sway } = useMemo(() => {
    const baseX = new Float32Array(COUNT)
    const baseZ = new Float32Array(COUNT)
    const speed = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const sway = new Float32Array(COUNT)
    for (let index = 0; index < COUNT; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 0.4
      baseX[index] = position[0] + Math.cos(angle) * radius
      baseZ[index] = position[2] + Math.sin(angle) * radius
      speed[index] = 0.25 + Math.random() * 0.35 // one full rise every ~2-4 s
      phase[index] = Math.random()
      sway[index] = Math.random() * Math.PI * 2
    }
    return { baseX, baseZ, speed, phase, sway }
  }, [position])
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    return geometry
  }, [])
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const time = clock.elapsedTime
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute
    const pos = positions.array as Float32Array
    const col = colors.array as Float32Array
    for (let index = 0; index < COUNT; index += 1) {
      const cycle = (time * speed[index] + phase[index]) % 1
      const drift = SWAY * cycle
      pos[index * 3] = baseX[index] + Math.sin(time * 2 + sway[index]) * drift
      pos[index * 3 + 1] = position[1] + 0.35 + cycle * RISE
      pos[index * 3 + 2] = baseZ[index] + Math.cos(time * 1.6 + sway[index] * 1.3) * drift
      // Cool from #ffb14e to #ff6b35 over the life, fading out at both ends.
      const fade = Math.sin(Math.PI * cycle)
      col[index * 3] = fade
      col[index * 3 + 1] = (0.69 - 0.27 * cycle) * fade
      col[index * 3 + 2] = (0.31 - 0.1 * cycle) * fade
    }
    positions.needsUpdate = true
    colors.needsUpdate = true
  })
  if (reducedMotion) return null
  return <points geometry={geometry} frustumCulled={false}>
    <pointsMaterial size={0.1} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation/>
  </points>
}
