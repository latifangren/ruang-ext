import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOOR_HEIGHT, type OfficeLayout } from '../office3d-layout.ts'

// Ambient dust motes drifting inside the office volume: one Points draw call, ~150 tiny
// particles, each on a slow sine drift. Disabled entirely under prefers-reduced-motion.
const COUNT = 150
const DRIFT_X = 0.25
const DRIFT_Y = 0.35
const DRIFT_Z = 0.25

export function DustParticles({ layout }: { layout: OfficeLayout }) {
  // Checked once on mount, not per frame.
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const { base, phase } = useMemo(() => {
    const { minX, maxX, minZ, maxZ } = layout.building
    const base = new Float32Array(COUNT * 3)
    const phase = new Float32Array(COUNT)
    for (let index = 0; index < COUNT; index += 1) {
      // Inset from the walls so the drift (below) can't push a mote through a wall.
      base[index * 3] = minX + 0.3 + Math.random() * (maxX - minX - 0.6)
      // Both floors: ground floor head height up to the balcony ceiling.
      base[index * 3 + 1] = 0.3 + Math.random() * (FLOOR_HEIGHT + 2.6)
      base[index * 3 + 2] = minZ + 0.3 + Math.random() * (maxZ - minZ - 0.6)
      phase[index] = Math.random() * Math.PI * 2
    }
    return { base, phase }
  }, [layout])
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3))
    return geometry
  }, [base])
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const time = clock.elapsedTime
    const array = (geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
    for (let index = 0; index < COUNT; index += 1) {
      const phi = phase[index]
      array[index * 3] = base[index * 3] + Math.sin(time * 0.25 + phi) * DRIFT_X
      array[index * 3 + 1] = base[index * 3 + 1] + Math.sin(time * 0.18 + phi * 1.7) * DRIFT_Y
      array[index * 3 + 2] = base[index * 3 + 2] + Math.cos(time * 0.22 + phi) * DRIFT_Z
    }
    geometry.attributes.position.needsUpdate = true
  })
  if (reducedMotion) return null
  return <points geometry={geometry} frustumCulled={false}>
    <pointsMaterial size={0.055} color="#ffe9c9" transparent opacity={0.32} sizeAttenuation depthWrite={false}/>
  </points>
}
