import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Vec3 } from '../office3d-layout.ts'
import { Cyl, RBox } from './props.tsx'
import { bannerCloth, cavePainting, flameSprite, furTex, roughStone, thatch } from './textures.ts'

// Tribe Mode architecture: a prehistoric settlement built from primitives and the
// procedural tribe textures. Earthy palette only, no modern or neon elements.
// Cut-away dollhouse style: walls facing the camera stay low so interiors show.

const WOOD = '#6b4a2f'
const WOOD_DARK = '#5a3d26'
const STONE = '#9b9284'
const STONE_CAP = '#6f675c'
const THICK = 0.28

/** Deterministic pseudo-random numbers so the settlement looks the same on every load. */
function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------------------------------------------------------------------------
// Palisade: a run of sharpened logs. All logs of one run are merged into two
// geometries (shafts + tips), so a whole fence is two draw calls.

const palisadeCache = new Map<string, { shafts: THREE.BufferGeometry; tips: THREE.BufferGeometry }>()

function palisadeGeometries(length: number, height: number) {
  const key = `${length.toFixed(2)}:${height.toFixed(2)}`
  const cached = palisadeCache.get(key)
  if (cached) return cached
  const rand = mulberry(Math.round(length * 997 + height * 131))
  const spacing = 0.42
  const count = Math.max(2, Math.round(length / spacing))
  const shafts: THREE.BufferGeometry[] = []
  const tips: THREE.BufferGeometry[] = []
  for (let index = 0; index < count; index += 1) {
    const x = -length / 2 + ((index + 0.5) * length) / count
    const radius = 0.15 + rand() * 0.05
    const h = height * (0.92 + rand() * 0.16)
    const shaft = new THREE.CylinderGeometry(radius * 0.94, radius, h, 7)
    shaft.translate(x, h / 2, 0)
    shafts.push(shaft)
    const tip = new THREE.ConeGeometry(radius * 0.94, 0.34, 7)
    tip.translate(x, h + 0.17, 0)
    tips.push(tip)
  }
  const merged = {
    shafts: mergeGeometries(shafts, false) ?? new THREE.BufferGeometry(),
    tips: mergeGeometries(tips, false) ?? new THREE.BufferGeometry(),
  }
  for (const geometry of [...shafts, ...tips]) geometry.dispose()
  palisadeCache.set(key, merged)
  return merged
}

export function Palisade({ from, to, height = 2.6 }: { from: [number, number]; to: [number, number]; height?: number }) {
  const [x1, z1] = from
  const [x2, z2] = to
  const geometries = useMemo(() => palisadeGeometries(Math.hypot(x2 - x1, z2 - z1), height), [x1, z1, x2, z2, height])
  const angle = Math.atan2(z2 - z1, x2 - x1)
  return <group position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]} rotation={[0, -angle, 0]}>
    <mesh geometry={geometries.shafts} castShadow receiveShadow>
      <meshStandardMaterial color={WOOD} roughness={0.95}/>
    </mesh>
    <mesh geometry={geometries.tips} castShadow>
      <meshStandardMaterial color={WOOD_DARK} roughness={0.95}/>
    </mesh>
  </group>
}

// ---------------------------------------------------------------------------
// StoneWall: rough-stone wall along a ground segment, like the old Wall helper
// but with the tribe's roughStone texture.

export function StoneWall({ from, to, height = 1.4 }: { from: [number, number]; to: [number, number]; height?: number }) {
  const [x1, z1] = from
  const [x2, z2] = to
  const stone = useMemo(() => roughStone([3, 1]), [])
  const length = Math.hypot(x2 - x1, z2 - z1)
  const angle = Math.atan2(z2 - z1, x2 - x1)
  return <group position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]} rotation={[0, -angle, 0]}>
    <RBox position={[0, height / 2, 0]} size={[length + THICK, height, THICK]} radius={0.04} color={STONE} map={stone} roughness={1}/>
    <RBox position={[0, height + 0.03, 0]} size={[length + THICK + 0.06, 0.08, THICK + 0.1]} radius={0.03} color={STONE_CAP} roughness={1}/>
  </group>
}

// ---------------------------------------------------------------------------
// Hut: stone walls with a low cut-away front, corner posts and a thatched
// pyramid roof with an overhang.

export function Hut({ position, size, rotation = 0 }: { position: Vec3; size: Vec3; rotation?: number }) {
  const [width, wallHeight, depth] = size
  const thatchTex = useMemo(() => thatch([3, 3]), [])
  const roofRadius = (Math.max(width, depth) / 2 + 0.55) * Math.SQRT2
  const roofHeight = 0.9 + Math.min(width, depth) * 0.28
  const hw = width / 2
  const hd = depth / 2
  return <group position={position} rotation={[0, rotation, 0]}>
    <StoneWall from={[-hw, -hd]} to={[hw, -hd]} height={wallHeight}/>
    <StoneWall from={[-hw, -hd]} to={[-hw, hd]} height={wallHeight}/>
    <StoneWall from={[hw, -hd]} to={[hw, hd]} height={wallHeight}/>
    {/* Front wall stays low (cut-away) so the interior stays visible */}
    <StoneWall from={[-hw, hd]} to={[hw, hd]} height={0.6}/>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <Cyl key={`${sx}${sz}`}
      position={[(sx * (hw - 0.12)), (wallHeight + 0.25) / 2, sz * (hd - 0.12)]}
      radius={0.14} height={wallHeight + 0.25} color={WOOD_DARK} roughness={0.95}/>)}
    <mesh position={[0, wallHeight + roofHeight / 2 - 0.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
      <coneGeometry args={[roofRadius, roofHeight, 4, 1]}/>
      <meshStandardMaterial map={thatchTex} color="#c9ab6b" roughness={1}/>
    </mesh>
    {/* Ridge pole cap */}
    <Cyl position={[0, wallHeight + roofHeight - 0.2, 0]} radius={0.09} height={0.7} rotation={[0, 0, Math.PI / 2]} color={WOOD_DARK} roughness={0.95}/>
  </group>
}

// ---------------------------------------------------------------------------
// Campfire: a ring of stones, crossed logs, an emissive flame, an additive glow
// sprite and one flickering point light.

const FIRE_ANGLES = [0.5, 2.1, 3.6, 5.2]

export function Campfire({ position, night = false }: { position: Vec3; night?: boolean }) {
  const glow = useMemo(() => flameSprite(), [])
  const calm = useMemo(reducedMotion, [])
  const light = useRef<THREE.PointLight>(null)
  const stones = useMemo(() => {
    const rand = mulberry(4242)
    return Array.from({ length: 9 }, (_, index) => {
      const angle = (index / 9) * Math.PI * 2 + rand() * 0.4
      const radius = 0.62 + rand() * 0.1
      const size = 0.13 + rand() * 0.08
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, size, key: index }
    })
  }, [])
  useFrame(({ clock }) => {
    if (!light.current) return
    const t = clock.elapsedTime
    // Gentle fire flicker; under prefers-reduced-motion barely a slow breathing.
    const flicker = calm
      ? Math.sin(t * 0.6) * 0.12
      : Math.sin(t * 11) * 0.5 + Math.sin(t * 23 + 1.7) * 0.3 + Math.sin(t * 5 + 0.6) * 0.2
    light.current.intensity = (night ? 2.3 : 1.6) + flicker * 0.5
  })
  return <group position={position}>
    {/* Scorched earth under the fire */}
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[0.95, 20]}/>
      <meshStandardMaterial color="#3a2c20" roughness={1}/>
    </mesh>
    {stones.map(({ x, z, size, key }) => <mesh key={key} position={[x, size * 0.45, z]} castShadow receiveShadow>
      <icosahedronGeometry args={[size, 0]}/>
      <meshStandardMaterial color="#7d766b" roughness={1}/>
    </mesh>)}
    {FIRE_ANGLES.map((angle) => <group key={angle} rotation={[0, angle, 0]}>
      <Cyl position={[0.18, 0.26, 0]} radius={0.07} height={1.1} rotation={[0, 0, 1.05]} color={WOOD_DARK} roughness={0.95}/>
    </group>)}
    <mesh position={[0, 0.62, 0]}>
      <coneGeometry args={[0.3, 1.15, 8]}/>
      <meshStandardMaterial color="#ff8c2a" emissive="#ff7a1a" emissiveIntensity={night ? 3.4 : 2.4} roughness={1}/>
    </mesh>
    <mesh position={[0, 0.45, 0]}>
      <coneGeometry args={[0.15, 0.62, 8]}/>
      <meshStandardMaterial color="#ffd23c" emissive="#ffc93c" emissiveIntensity={night ? 4 : 3} roughness={1}/>
    </mesh>
    <sprite position={[0, 0.68, 0]} scale={[2.6, 2.6, 1]}>
      <spriteMaterial map={glow} color="#ff9a3c" transparent opacity={night ? 0.75 : 0.5} depthWrite={false} blending={THREE.AdditiveBlending}/>
    </sprite>
    <pointLight ref={light} position={[0, 1.2, 0]} color="#ff9a3c" intensity={night ? 2.3 : 1.6} distance={12} decay={2}/>
  </group>
}

// ---------------------------------------------------------------------------
// Torch: a wooden pole with an emissive flame and glow sprite. No point light
// unless `withLight` — the scene keeps at most 3 dynamic point lights
// (1 campfire + up to 2 torches).

export function Torch({ position, withLight = false, night = false }: { position: Vec3; withLight?: boolean; night?: boolean }) {
  const glow = useMemo(() => flameSprite(), [])
  return <group position={position}>
    <Cyl position={[0, 0.85, 0]} radius={0.06} height={1.7} color={WOOD_DARK} roughness={0.95}/>
    <Cyl position={[0, 1.72, 0]} radius={0.095} height={0.2} color="#3a2a1a" roughness={1}/>
    <mesh position={[0, 2.05, 0]}>
      <coneGeometry args={[0.14, 0.52, 7]}/>
      <meshStandardMaterial color="#ff8c2a" emissive="#ff7a1a" emissiveIntensity={night ? 3.2 : 2.2} roughness={1}/>
    </mesh>
    <sprite position={[0, 2.05, 0]} scale={[1.4, 1.4, 1]}>
      <spriteMaterial map={glow} color="#ff9a3c" transparent opacity={night ? 0.7 : 0.45} depthWrite={false} blending={THREE.AdditiveBlending}/>
    </sprite>
    {withLight && <pointLight position={[0, 2.2, 0]} color="#ff9a3c" intensity={night ? 1.7 : 1.0} distance={7} decay={2}/>}
  </group>
}

// ---------------------------------------------------------------------------
// TimberGate: two heavy posts, a top beam and plank doors, one left ajar.

export function TimberGate({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const planks = [-0.48, 0, 0.48]
  return <group position={position} rotation={[0, rotation, 0]}>
    {[-1.35, 1.35].map((x) => <group key={x}>
      <Cyl position={[x, 1.5, 0]} radius={0.22} height={3} color={WOOD_DARK} roughness={0.95}/>
      <mesh position={[x, 3.12, 0]} castShadow>
        <coneGeometry args={[0.24, 0.42, 8]}/>
        <meshStandardMaterial color="#4a3420" roughness={1}/>
      </mesh>
    </group>)}
    <RBox position={[0, 2.92, 0]} size={[3.7, 0.34, 0.34]} radius={0.05} color={WOOD} roughness={0.95}/>
    {/* Left door, swung open; right door shut */}
    <group position={[-0.68, 0, 0]} rotation={[0, 0.7, 0]}>
      {planks.map((x) => <RBox key={x} position={[x, 1.75, 0]} size={[0.4, 2.3, 0.12]} radius={0.03} color={WOOD} roughness={0.95}/>)}
      <RBox position={[0, 2.5, 0.09]} size={[1.36, 0.16, 0.06]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>
      <RBox position={[0, 1.0, 0.09]} size={[1.36, 0.16, 0.06]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>
    </group>
    <group position={[0.68, 0, 0]}>
      {planks.map((x) => <RBox key={x} position={[x, 1.75, 0]} size={[0.4, 2.3, 0.12]} radius={0.03} color={WOOD} roughness={0.95}/>)}
      <RBox position={[0, 2.5, 0.09]} size={[1.36, 0.16, 0.06]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>
      <RBox position={[0, 1.0, 0.09]} size={[1.36, 0.16, 0.06]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>
    </group>
  </group>
}

// ---------------------------------------------------------------------------
// Watchtower: four splayed legs, a platform with a railing, a ladder and a
// small thatched roof.

export function Watchtower({ position }: { position: Vec3 }) {
  const thatchTex = useMemo(() => thatch([2, 2]), [])
  const legTilt = 0.111
  const legHeight = 2.74
  const platformY = 2.7
  const corners: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
  return <group position={position}>
    {corners.map(([sx, sz]) => <Cyl key={`${sx}${sz}`}
      position={[sx * 0.95, legHeight / 2, sz * 0.95]}
      radius={0.12} height={legHeight} rotation={[-legTilt * sz, 0, legTilt * sx]}
      color={WOOD_DARK} roughness={0.95}/>)}
    {/* Cross braces */}
    {[1.35, 2.1].map((y) => <group key={y}>
      <RBox position={[0, y, 0.98]} size={[1.9, 0.1, 0.1]} radius={0.02} color={WOOD} roughness={0.95}/>
      <RBox position={[0, y, -0.98]} size={[1.9, 0.1, 0.1]} radius={0.02} color={WOOD} roughness={0.95}/>
      <RBox position={[0.98, y, 0]} size={[0.1, 0.1, 1.9]} radius={0.02} color={WOOD} roughness={0.95}/>
      <RBox position={[-0.98, y, 0]} size={[0.1, 0.1, 1.9]} radius={0.02} color={WOOD} roughness={0.95}/>
    </group>)}
    <RBox position={[0, platformY, 0]} size={[2.2, 0.18, 2.2]} radius={0.03} color={WOOD} roughness={0.95}/>
    {/* Railing */}
    {corners.map(([sx, sz]) => <RBox key={`p${sx}${sz}`} position={[sx * 1.02, platformY + 0.45, sz * 1.02]} size={[0.1, 0.9, 0.1]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>)}
    {[[0, 1.02], [0, -1.02]].map(([x, z], index) => <RBox key={`r${index}`} position={[x, platformY + 0.82, z]} size={[2.14, 0.08, 0.08]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>)}
    {[[1.02, 0], [-1.02, 0]].map(([x, z], index) => <RBox key={`r${index + 2}`} position={[x, platformY + 0.82, z]} size={[0.08, 0.08, 2.14]} radius={0.02} color={WOOD_DARK} roughness={0.95}/>)}
    {/* Roof posts + thatch cap */}
    {corners.map(([sx, sz]) => <Cyl key={`c${sx}${sz}`} position={[sx * 0.95, platformY + 1.3, sz * 0.95]} radius={0.08} height={1.3} color={WOOD_DARK} roughness={0.95}/>)}
    <mesh position={[0, platformY + 2.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[2.05, 1.2, 4, 1]}/>
      <meshStandardMaterial map={thatchTex} color="#c9ab6b" roughness={1}/>
    </mesh>
    <Ladder position={[0, 0, 1.32]} height={platformY} rotation={0}/>
  </group>
}

// ---------------------------------------------------------------------------
// Ladder: two rails and rungs, leaning against an edge. Replaces the staircase
// for the tribe theme; the walk routing still uses the STAIRS constants.

export function Ladder({ position, height, rotation = 0 }: { position: Vec3; height: number; rotation?: number }) {
  const tilt = 0.28
  const railLength = height / Math.cos(tilt)
  const rungCount = Math.max(2, Math.floor(height / 0.45))
  const offset = (y: number) => Math.tan(tilt) * y
  return <group position={position} rotation={[0, rotation, 0]}>
    {[-0.3, 0.3].map((x) => <Cyl key={x}
      position={[x, height / 2, offset(height / 2)]}
      radius={0.055} height={railLength} rotation={[tilt, 0, 0]}
      color={WOOD} roughness={0.95}/>)}
    {Array.from({ length: rungCount }, (_, index) => {
      const y = ((index + 1) * height) / (rungCount + 1)
      return <Cyl key={index} position={[0, y, offset(y)]} radius={0.035} height={0.62} rotation={[0, 0, Math.PI / 2]} color={WOOD_DARK} roughness={0.95}/>
    })}
  </group>
}

// ---------------------------------------------------------------------------
// FurBedroll: a flat fur sleeping mat with a rolled pillow.

export function FurBedroll({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const fur = useMemo(() => furTex(), [])
  return <group position={position} rotation={[0, rotation, 0]}>
    <RBox position={[0, 0.11, 0]} size={[0.95, 0.2, 1.8]} radius={0.08} color="#8a6a44" map={fur} roughness={1}/>
    <Cyl position={[0, 0.2, -0.68]} radius={0.13} height={0.8} rotation={[0, 0, Math.PI / 2]} color="#6b4f34" map={fur} roughness={1}/>
  </group>
}

// ---------------------------------------------------------------------------
// Batch C props: work furniture and outdoor dressing for the tribe village.
// Earthy palette only; no point lights here (the 3-light budget stays in
// environment.tsx: 1 campfire + up to 2 torches).

/** Stone work table: a thick rough-stone slab on two stone feet. Replaces WorkDesk. */
export function StoneTable({ position }: { position: Vec3 }) {
  const stone = useMemo(() => roughStone([2, 1]), [])
  return <group position={position}>
    <RBox position={[0, 0.72, 0]} size={[1.7, 0.18, 1]} radius={0.05} color="#a8a094" map={stone} roughness={1}/>
    {[-0.6, 0.6].map((x) => <RBox key={x} position={[x, 0.315, 0]} size={[0.28, 0.63, 0.8]} radius={0.04} color={STONE} map={stone} roughness={1}/>)}
  </group>
}

/** Stool: a short wooden seat on three legs. Replaces the office chair. */
export function Stool({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <Cyl position={[0, 0.42, 0]} radius={0.22} height={0.12} color={WOOD} roughness={0.95}/>
    {[0, 1, 2].map((index) => {
      const angle = (index / 3) * Math.PI * 2
      return <Cyl key={index} position={[Math.cos(angle) * 0.14, 0.18, Math.sin(angle) * 0.14]} radius={0.035} height={0.36} color={WOOD_DARK} roughness={0.95}/>
    })}
  </group>
}

/** ClayPot: a squashed-sphere pot with a neck and rim, in clay #a35f36. */
export function ClayPot({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const clay = '#a35f36'
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.24, 0]} scale={[1, 0.8, 1]} castShadow receiveShadow>
      <sphereGeometry args={[0.3, 14, 12]}/>
      <meshStandardMaterial color={clay} roughness={0.9}/>
    </mesh>
    <Cyl position={[0, 0.5, 0]} radius={0.15} height={0.16} color={clay} roughness={0.9}/>
    <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[0.15, 0.028, 8, 18]}/>
      <meshStandardMaterial color="#8a4e2c" roughness={0.9}/>
    </mesh>
  </group>
}

/** Basket: a tapered woven basket with a rim and a dark open top. */
export function Basket({ position }: { position: Vec3 }) {
  return <group position={position}>
    <Cyl position={[0, 0.2, 0]} radius={0.32} top={0.26} height={0.4} segments={14} color="#a3854a" roughness={1}/>
    <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[0.26, 0.035, 8, 18]}/>
      <meshStandardMaterial color="#7d6234" roughness={1}/>
    </mesh>
    {/* Dark disc fakes the hollow inside */}
    <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.24, 16]}/>
      <meshStandardMaterial color="#43331f" roughness={1}/>
    </mesh>
  </group>
}

/** FirewoodStack: a pyramid of 10 horizontal logs. */
export function FirewoodStack({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const rows = [4, 3, 2, 1]
  const rand = mulberry(31337)
  const logs: { key: string; x: number; y: number; z: number; shade: string }[] = []
  rows.forEach((count, row) => {
    for (let index = 0; index < count; index += 1) {
      logs.push({
        key: `${row}-${index}`,
        x: (rand() - 0.5) * 0.08,
        y: 0.09 + row * 0.155,
        z: (index - (count - 1) / 2) * 0.19,
        shade: rand() > 0.5 ? WOOD : WOOD_DARK,
      })
    }
  })
  return <group position={position} rotation={[0, rotation, 0]}>
    {logs.map(({ key, x, y, z, shade }) => <Cyl key={key} position={[x, y, z]} radius={0.09} height={1.1} rotation={[0, 0, Math.PI / 2]} color={shade} roughness={0.95}/>)}
  </group>
}

/** HideRack: two posts, a crossbar and two static fur hides. */
export function HideRack({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const fur = useMemo(() => furTex(), [])
  return <group position={position} rotation={[0, rotation, 0]}>
    {[-0.8, 0.8].map((x) => <Cyl key={x} position={[x, 0.8, 0]} radius={0.07} height={1.6} color={WOOD_DARK} roughness={0.95}/>)}
    <Cyl position={[0, 1.52, 0]} radius={0.05} height={1.9} rotation={[0, 0, Math.PI / 2]} color={WOOD} roughness={0.95}/>
    {[-0.42, 0.42].map((x, index) => <mesh key={x} position={[x, 0.95, 0.01]} rotation={[0, 0, index === 0 ? 0.04 : -0.05]} castShadow receiveShadow>
      <planeGeometry args={[0.72, 1.1]}/>
      <meshStandardMaterial map={fur} color="#b08a5a" roughness={1} side={THREE.DoubleSide}/>
    </mesh>)}
  </group>
}

/** Banner: a tall pole with a woven bannerCloth panel hanging from a top bar. */
export function Banner({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const cloth = useMemo(() => bannerCloth(), [])
  return <group position={position} rotation={[0, rotation, 0]}>
    <Cyl position={[0, 1.5, 0]} radius={0.08} height={3} color={WOOD_DARK} roughness={0.95}/>
    <Cyl position={[0, 2.86, 0]} radius={0.045} height={1.3} rotation={[0, 0, Math.PI / 2]} color={WOOD} roughness={0.95}/>
    <mesh position={[0, 2.05, 0]} castShadow>
      <planeGeometry args={[1, 1.5]}/>
      <meshStandardMaterial map={cloth} roughness={1} side={THREE.DoubleSide}/>
    </mesh>
  </group>
}

/** CavePainting: a square plane with the cavePainting texture, to hang on a stone wall. */
export function CavePainting({ position, rotation = 0, width = 1.6 }: { position: Vec3; rotation?: number; width?: number }) {
  const painting = useMemo(() => cavePainting(), [])
  return <mesh position={position} rotation={[0, rotation, 0]}>
    <planeGeometry args={[width, width]}/>
    <meshStandardMaterial map={painting} roughness={1}/>
  </mesh>
}

/** Rocks: grey dodecahedrons in deterministic random sizes. */
export function Rocks({ positions }: { positions: Vec3[] }) {
  const rand = mulberry(918)
  return <group>
    {positions.map(([x, y, z], index) => {
      const radius = 0.25 + rand() * 0.45
      const squash = 0.6 + rand() * 0.5
      return <mesh key={index} position={[x, y + radius * squash * 0.55, z]} rotation={[0, rand() * Math.PI * 2, 0]} scale={[1, squash, 0.85]} castShadow receiveShadow>
        <dodecahedronGeometry args={[radius, 0]}/>
        <meshStandardMaterial color="#8a8578" roughness={1} flatShading/>
      </mesh>
    })}
  </group>
}

/** Fern: a tuft of 5 small green cones. */
export function Fern({ position }: { position: Vec3 }) {
  const [px, , pz] = position
  const rand = mulberry(Math.round(px * 131 + pz * 719) || 7)
  return <group position={position}>
    {Array.from({ length: 5 }, (_, index) => {
      const angle = (index / 5) * Math.PI * 2 + rand() * 0.6
      const height = 0.35 + rand() * 0.25
      const tilt = 0.25 + rand() * 0.25
      return <mesh key={index} position={[Math.cos(angle) * 0.09, height / 2 - 0.02, Math.sin(angle) * 0.09]} rotation={[Math.sin(angle) * tilt, 0, -Math.cos(angle) * tilt]} castShadow>
        <coneGeometry args={[0.12 + rand() * 0.08, height, 6]}/>
        <meshStandardMaterial color="#4f7d43" roughness={1} flatShading/>
      </mesh>
    })}
  </group>
}

// ---------------------------------------------------------------------------
// Mammoth: a low-poly silhouette for the far bank of the river. Fully static
// (no animation), so it is safe under prefers-reduced-motion.

const MAMMOTH_FUR = '#6b5a48'

export function Mammoth({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const fur = useMemo(() => furTex(), [])
  return <group position={position} rotation={[0, rotation, 0]}>
    {/* Body and shoulder hump */}
    <RBox position={[0, 1.7, 0]} size={[2.6, 1.6, 1.5]} radius={0.35} color={MAMMOTH_FUR} map={fur} roughness={1}/>
    <mesh position={[0.75, 2.55, 0]} scale={[1, 0.75, 0.9]} castShadow>
      <sphereGeometry args={[0.62, 10, 8]}/>
      <meshStandardMaterial color={MAMMOTH_FUR} map={fur} roughness={1}/>
    </mesh>
    {/* Head */}
    <RBox position={[1.55, 1.95, 0]} size={[0.9, 0.9, 0.9]} radius={0.25} color={MAMMOTH_FUR} map={fur} roughness={1}/>
    {/* Trunk: two angled segments */}
    <RBox position={[1.98, 1.4, 0]} size={[0.28, 0.9, 0.28]} radius={0.1} rotation={[0, 0, 0.22]} color={MAMMOTH_FUR} map={fur} roughness={1}/>
    <RBox position={[2.1, 0.82, 0]} size={[0.24, 0.7, 0.24]} radius={0.09} rotation={[0, 0, -0.12]} color={MAMMOTH_FUR} map={fur} roughness={1}/>
    {/* Tusks */}
    {[0.32, -0.32].map((z) => <mesh key={z} position={[1.86, 1.05, z]} rotation={[z > 0 ? 0.25 : -0.25, 0, -2.1]} castShadow>
      <coneGeometry args={[0.07, 1.15, 8]}/>
      <meshStandardMaterial color="#e8e0d0" roughness={0.7}/>
    </mesh>)}
    {/* Legs */}
    {[[0.9, 0.45], [0.9, -0.45], [-0.9, 0.45], [-0.9, -0.45]].map(([x, z]) => <Cyl key={`${x},${z}`}
      position={[x, 0.55, z]} radius={0.22} height={1.1} color={MAMMOTH_FUR} map={fur} roughness={1}/>)}
    {/* Tail */}
    <RBox position={[-1.42, 1.9, 0]} size={[0.14, 0.7, 0.14]} radius={0.06} rotation={[0, 0, 0.3]} color={MAMMOTH_FUR} map={fur} roughness={1}/>
  </group>
}
