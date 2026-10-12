import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../office3d-layout.ts'
import { flameSprite } from './textures.ts'

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

// Smoke: soft grey sprites rising from the campfire, growing and fading as they
// climb. One sprite per puff (16 draw calls, all tiny). Disabled entirely under
// prefers-reduced-motion.
const SMOKE_COUNT = 16
const SMOKE_RISE = 3.6

export function SmokeParticles({ position }: { position: Vec3 }) {
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const puff = useMemo(() => flameSprite(), [])
  const sprites = useMemo(() => {
    const rand = (seed: number) => {
      let value = seed
      return () => {
        value = (value * 16807) % 2147483647
        return (value - 1) / 2147483646
      }
    }
    const next = rand(606)
    return Array.from({ length: SMOKE_COUNT }, () => ({
      phase: next(),
      speed: 0.1 + next() * 0.09,
      sway: next() * Math.PI * 2,
      x0: (next() - 0.5) * 0.5,
      z0: (next() - 0.5) * 0.5,
    }))
  }, [])
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const time = clock.elapsedTime
    sprites.forEach((sprite, index) => {
      const node = refs.current[index]
      if (!node) return
      const cycle = (time * sprite.speed + sprite.phase) % 1
      node.position.set(
        position[0] + sprite.x0 + Math.sin(time * 0.8 + sprite.sway) * cycle * 0.9,
        position[1] + 1.1 + cycle * SMOKE_RISE,
        position[2] + sprite.z0 + Math.cos(time * 0.6 + sprite.sway) * cycle * 0.7,
      )
      const size = 0.9 + cycle * 2.6
      node.scale.set(size, size, 1)
      const material = node.material as THREE.SpriteMaterial
      material.opacity = 0.26 * Math.sin(Math.PI * Math.min(1, cycle * 1.1))
    })
  })
  if (reducedMotion) return null
  return <group>
    {sprites.map((_, index) => <sprite
      key={index}
      ref={(node) => { refs.current[index] = node }}
      position={[position[0], position[1] + 1.1, position[2]]}>
      <spriteMaterial map={puff} color="#8f8a80" transparent opacity={0} depthWrite={false}/>
    </sprite>)}
  </group>
}

// Fireflies: small blinking sparks drifting around the compound, only after dark.
// One Points draw call. Disabled entirely under prefers-reduced-motion.
const FLY_COUNT = 28

export function Fireflies({ center, night }: { center: Vec3; night: boolean }) {
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const { geometry, phase } = useMemo(() => {
    let value = 909
    const next = () => {
      value = (value * 16807) % 2147483647
      return (value - 1) / 2147483646
    }
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(FLY_COUNT * 3)
    const colors = new Float32Array(FLY_COUNT * 3)
    const phase = new Float32Array(FLY_COUNT)
    for (let index = 0; index < FLY_COUNT; index += 1) {
      const angle = next() * Math.PI * 2
      const radius = 2.5 + next() * 7
      positions[index * 3] = center[0] + Math.cos(angle) * radius
      positions[index * 3 + 1] = 0.5 + next() * 1.9
      positions[index * 3 + 2] = center[2] + Math.sin(angle) * radius
      phase[index] = next() * Math.PI * 2
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry, phase }
  }, [center])
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const time = clock.elapsedTime
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute
    const col = colors.array as Float32Array
    for (let index = 0; index < FLY_COUNT; index += 1) {
      const blink = Math.max(0, Math.sin(time * 2.1 + phase[index]))
      const glow = 0.15 + 0.85 * blink * blink
      col[index * 3] = 0.78 * glow
      col[index * 3 + 1] = 1.0 * glow
      col[index * 3 + 2] = 0.45 * glow
    }
    colors.needsUpdate = true
  })
  if (!night || reducedMotion) return null
  return <points geometry={geometry} frustumCulled={false}>
    <pointsMaterial size={0.16} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation/>
  </points>
}
