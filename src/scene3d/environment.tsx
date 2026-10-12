import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { COMPOUND_PAD, campfirePosition, fireRingSpots, FLOOR_HEIGHT, gateX as gateXOf, hutCenters, storageCorner, watchtowerPos, type Floor as FloorNumber, type OfficeLayout, STAIRS, type Vec3 } from '../office3d-layout.ts'
import { Cyl, RBox, Tree } from './props.tsx'
import { dirtGround, grass, planks, waterTex } from './textures.ts'
import { Banner, Basket, Campfire, CavePainting, ClayPot, Fern, FirewoodStack, FurBedroll, GravelPath, HideRack, Hut, Ladder, LogStool, Mammoth, Palisade, Rocks, StiltHut, BambooRail, StoneWall, TimberGate, Torch, Watchtower, mulberry } from './tribe.tsx'
import { Fireflies, SmokeParticles } from './embers.tsx'

// The tribe compound (floors, palisade, huts, fire) and its surroundings (meadow,
// river, forest, rock-art panel by the gate). In the evening (dark theme) the
// torches and the campfire burn brighter. Walls facing the camera are kept low,
// like a cut-away dollhouse, so the inside stays visible from any angle.

function Floor({ position, size, map, color = '#ffffff', roughness = 0.8 }: { position: Vec3; size: [number, number]; map?: THREE.Texture; color?: string; roughness?: number }) {
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={size}/>
    <meshStandardMaterial map={map} color={color} roughness={roughness}/>
  </mesh>
}

/** Lantai 1: the tribe compound — palisade yard, gate, campfire, hut row, work
 *  area, storage corner and torches, zoned with room to breathe. */
function TribeCompound({ night, layout }: { night: boolean; layout: OfficeLayout }) {
  const { minX, maxX, minZ, maxZ } = layout.building
  const PAD = COMPOUND_PAD
  const dirt = useMemo(() => dirtGround([8, 5]), [])
  const gx = gateXOf(layout.building)
  const gateHalf = 1.7
  const fire = campfirePosition(layout)
  const [fireX, , fireZ] = fire
  const huts = hutCenters(layout.building, layout.deskCount)
  const storage = storageCorner(layout.building)
  const tower = watchtowerPos(layout.building)
  const ring = fireRingSpots(layout.building)
  const px0 = minX - PAD
  const px1 = maxX + PAD
  const pz0 = minZ - PAD
  const pz1 = maxZ + PAD
  // Deterministic scatter of pebbles and grass tufts, kept clear of the fire,
  // huts, desks, storage, the gate path and the tower.
  const scatter = useMemo(() => {
    const rand = mulberry(777)
    const rocks: Vec3[] = []
    const ferns: Vec3[] = []
    const hutClear = ({ x, z }: { x: number; z: number }) => huts.some((h) => Math.abs(x - h.x) < 2.8 && Math.abs(z - h.z) < 2.6)
    const deskClear = (x: number, z: number) => layout.desks.some(([dx, , dz]) => Math.hypot(x - dx, z - dz) < 1.5)
    const segDist = (x: number, z: number) => {
      // Distance from the gate→fire path segment.
      const ax = gx
      const az = pz1 - 0.4
      const dx = fireX - ax
      const dz = fireZ - az
      const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
      return Math.hypot(x - (ax + t * dx), z - (az + t * dz))
    }
    for (let i = 0; i < 30; i += 1) {
      const x = px0 + 1 + rand() * (px1 - px0 - 2)
      const z = pz0 + 1 + rand() * (pz1 - pz0 - 2)
      if (Math.hypot(x - fireX, z - fireZ) < 2.9) continue
      if (hutClear({ x, z })) continue
      if (deskClear(x, z)) continue
      if (Math.hypot(x - storage.x, z - storage.z) < 2.6) continue
      if (Math.hypot(x - tower.x, z - tower.z) < 2.2) continue
      if (segDist(x, z) < 1.5) continue
      if (Math.hypot(x - gx, z - pz1) < 2.2) continue
      if (rand() < 0.45) rocks.push([x, 0, z])
      else ferns.push([x, 0, z])
    }
    return { rocks, ferns }
  }, [px0, px1, pz0, pz1, fireX, fireZ, gx, huts, layout.desks, storage.x, storage.z, tower.x, tower.z])
  return <group>
    <Floor position={[(px0 + px1) / 2, 0.005, (pz0 + pz1) / 2]} size={[px1 - px0, pz1 - pz0]} map={dirt} roughness={1}/>
    {/* Palisade: full height at the back and sides, low towards the camera (cut-away) */}
    <Palisade from={[px0, pz0]} to={[px1, pz0]} height={2.6}/>
    <Palisade from={[px0, pz0]} to={[px0, pz1]} height={2.6}/>
    <Palisade from={[px1, pz0]} to={[px1, pz1]} height={2.6}/>
    <Palisade from={[px0, pz1]} to={[gx - gateHalf, pz1]} height={1.15}/>
    <Palisade from={[gx + gateHalf, pz1]} to={[px1, pz1]} height={1.15}/>
    <TimberGate position={[gx, 0, pz1]}/>
    {/* Gravel footpath from the gate to the campfire */}
    <GravelPath from={[gx, pz1 - 0.4]} to={[fireX, fireZ]}/>
    <Campfire position={fire} night={night}/>
    <SmokeParticles position={fire}/>
    {/* Log stools where idle agents sit around the fire */}
    {ring.map(({ x, z, facing }) => <LogStool key={`${x.toFixed(2)},${z.toFixed(2)}`} position={[x, 0, z]} rotation={facing}/>)}
    {/* Hut row along the back, right of the work area */}
    {huts.map(({ x, z }) => <Hut key={`${x.toFixed(1)},${z.toFixed(1)}`} position={[x, 0, z]} size={[3.6, 1.5, 3.2]}/>)}
    {/* Storage corner, front-left: firewood, hides, pots and a basket */}
    <FirewoodStack position={[storage.x - 1.1, 0, storage.z + 0.2]} rotation={0.3}/>
    <HideRack position={[storage.x + 1.1, 0, storage.z - 0.5]} rotation={Math.PI / 2}/>
    <ClayPot position={[storage.x + 0.2, 0, storage.z + 1.4]}/>
    <Basket position={[storage.x + 1.2, 0, storage.z + 1.2]}/>
    <Watchtower position={[tower.x, 0, tower.z]}/>
    {/* The ladder up to the sleeping floor, where the stairs stood */}
    <Ladder position={[2.0, 0, STAIRS.z]} height={FLOOR_HEIGHT} rotation={Math.PI / 2}/>
    {/* Ground dressing */}
    <Rocks positions={scatter.rocks}/>
    {scatter.ferns.map(([x, , z]) => <Fern key={`${x.toFixed(2)},${z.toFixed(2)}`} position={[x, 0, z]}/>)}
    {/* Torches: the two by the gate carry lights (3 point lights total with the fire) */}
    <Torch position={[gx - 2.3, 0, pz1 - 0.7]} withLight night={night}/>
    <Torch position={[gx + 2.3, 0, pz1 - 0.7]} withLight night={night}/>
    <Torch position={[fireX + 2.3, 0, fireZ + 1.4]} night={night}/>
    <Torch position={[px0 + 1.1, 0, pz1 - 1.1]} night={night}/>
    <Fireflies center={[(px0 + px1) / 2, 0, (pz0 + pz1) / 2]} night={night}/>
  </group>
}

/** Lantai 2: a stilt-house village — one rumah-panggung sleeping hut per bed
 *  column, linked by a plank walkway with bamboo railings. No giant slab. */
function SleepingQuarters({ night, layout }: { night: boolean; layout: OfficeLayout }) {
  const plankTex = useMemo(() => planks([6, 2]), [])
  const bedCols = [...new Set(layout.beds.map(([x]) => x))].sort((a, b) => a - b)
  const hutW = 2.6
  const hutD = 3.6
  const hutZ = -2.85
  // Plank walkway in front of the huts, reaching the ladder head.
  const walkX0 = Math.min(...bedCols, 1.0) - 1.8
  const walkX1 = Math.max(...bedCols, 3.0) + 1.2
  const walkZ0 = -1.0
  const walkZ1 = 3.8
  const postXs: number[] = []
  for (let x = walkX0 + 0.4; x <= walkX1 - 0.3; x += 2.4) postXs.push(x)
  postXs.push(walkX1 - 0.4)
  return <group>
    {/* Walkway posts + plank deck */}
    {postXs.map((x) => [walkZ0 + 0.4, (walkZ0 + walkZ1) / 2, walkZ1 - 0.4].map((z) => <Cyl key={`${x.toFixed(1)},${z.toFixed(1)}`}
      position={[x, FLOOR_HEIGHT / 2, z]} radius={0.12} height={FLOOR_HEIGHT} color="#5a3d26" roughness={0.95}/>))}
    <RBox position={[(walkX0 + walkX1) / 2, FLOOR_HEIGHT - 0.09, (walkZ0 + walkZ1) / 2]}
      size={[walkX1 - walkX0, 0.18, walkZ1 - walkZ0]} radius={0.02} color="#8a6a42" map={plankTex} roughness={0.95}/>
    {/* Stilt huts, one per bed column; bedrolls show through the open fronts */}
    {bedCols.map((x) => <StiltHut key={x.toFixed(1)} position={[x, 0, hutZ]} size={[hutW, hutD]} night={night}/>)}
    <group position={[0, FLOOR_HEIGHT, 0]}>
      {layout.beds.map(([x, , z], index) => <FurBedroll key={index} position={[x, 0.01, z + 0.2]}/>)}
    </group>
    {/* Bamboo railings: south edge with a gap where the ladder lands, plus both ends */}
    <BambooRail from={[walkX0, walkZ1]} to={[1.0, walkZ1]} y={FLOOR_HEIGHT}/>
    <BambooRail from={[3.0, walkZ1]} to={[walkX1, walkZ1]} y={FLOOR_HEIGHT}/>
    <BambooRail from={[walkX0, walkZ0]} to={[walkX0, walkZ1]} y={FLOOR_HEIGHT}/>
    <BambooRail from={[walkX1, walkZ0]} to={[walkX1, walkZ1]} y={FLOOR_HEIGHT}/>
    {/* The ladder from the ground, landing on the walkway through the railing gap */}
    <Ladder position={[2.0, 0, STAIRS.z]} height={FLOOR_HEIGHT} rotation={Math.PI / 2}/>
    {/* One emissive torch on the walkway (no new point light) */}
    <Torch position={[walkX0 + 0.7, FLOOR_HEIGHT, walkZ1 - 0.7]} night={night}/>
  </group>
}

const calmMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The river behind the compound: an animated water plane, fully still under reduced motion. */
function River({ width }: { width: number }) {
  const water = useMemo(() => waterTex([10, 2]), [])
  const calm = useMemo(calmMotion, [])
  useFrame((_, delta) => {
    if (calm) return
    water.offset.x = (water.offset.x + delta * 0.02) % 1
  })
  return <mesh position={[0, 0.01, -11.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[width, 4.5]}/>
    <meshStandardMaterial map={water} roughness={0.35}/>
  </mesh>
}

/** The wilderness around the compound: meadow, river, forest and a distant mammoth.
 *  The gate vignette (banner, rock-art panel, dirt apron) only renders on lantai 1 —
 *  from the sleeping floor it would read as floating debris. */
function Outdoors({ layout, floor }: { layout: OfficeLayout; floor: FloorNumber }) {
  // How far the building grew to the left for a larger crew; the grounds grow with it.
  const shift = layout.building.minX + 9.5
  const { maxZ } = layout.building
  const lawn = useMemo(() => grass([14, 12]), [])
  const apron = useMemo(() => dirtGround([3, 3]), [])
  const gateX = gateXOf(layout.building)
  const groundWidth = 60 - shift
  // Trees: sparse near the village, dense on the far river bank. [x, z, size].
  const trees: [number, number, number][] = [
    [-16 + shift, -16.5, 1.3], [-8 + shift, -17.5, 1.1], [-1 + shift, -16, 1.4], [6, -17, 1.2],
    [13, -16, 1.3], [19, -17.5, 1.1], [-21 + shift, -15, 1.0], [3 + shift, -18.5, 1.2],
    [-12 + shift, -8, 1.1], [12, -8.5, 1.0], [-4 + shift, -9, 0.9],
    [-14 + shift, 0, 1.2], [14.5, -2, 1.1], [15, 5, 1.0], [-13 + shift, 6.5, 1.0],
    [-10 + shift, 10.5, 1.0], [10, 11, 1.1], [2, 13.5, 0.9], [-16 + shift, 13, 1.0],
  ]
  const rocks: Vec3[] = [
    [-6 + shift, 0, -9.5], [4, 0, -9], [10, 0, -14.5], [-13 + shift, 0, -15],
    [16, 0, -10], [-9 + shift, 0, 8], [13, 0, 7.5], [1, 0, 12],
  ]
  const ferns: Vec3[] = [
    [-3 + shift, 0, -9], [7, 0, -9.5], [-11 + shift, 0, -14], [12, 0, -15],
    [18, 0, -13], [-8 + shift, 0, 6], [11.5, 0, 8.5], [-14 + shift, 0, 11],
  ]
  return <group>
    {/* Meadow, with a packed-dirt apron in front of the gate (lantai 1 only) */}
    <Floor position={[shift / 2, -0.02, 2]} size={[groundWidth, 44]} map={lawn} roughness={1}/>
    {floor === 1 && <Floor position={[gateX, -0.01, 7]} size={[7, 6]} map={apron} roughness={1}/>}
    <River width={groundWidth}/>
    {trees.map(([x, z, size]) => <Tree key={`${x},${z}`} position={[x, 0, z]} size={size}/>)}
    <Rocks positions={rocks}/>
    {ferns.map(([x, , z]) => <Fern key={`${x},${z}`} position={[x, 0, z]}/>)}
    {/* A mammoth grazing on the far bank, small in the frame */}
    <Mammoth position={[7, 0, -16]} rotation={-0.5}/>
    {/* Gate vignette: a banner and a rock-art panel (lantai 1 only) */}
    {floor === 1 && <>
      <Banner position={[gateX - 2.4, 0, maxZ + 0.8]}/>
      <StoneWall from={[gateX + 1.0, maxZ + 1.2]} to={[gateX + 3.4, maxZ + 1.2]} height={1.2}/>
      <CavePainting position={[gateX + 2.2, 0.62, maxZ + 1.36]} width={2}/>
    </>}
  </group>
}

/** The grounds plus the floor in view: lantai 1 as a cut-away tribe compound, or lantai 2 the sleeping floor above it. */
export function Environment({ night = false, layout, floor = 1 }: { night?: boolean; layout: OfficeLayout; floor?: FloorNumber }) {
  return <group>
    {floor === 1 ? <TribeCompound night={night} layout={layout}/> : <SleepingQuarters night={night} layout={layout}/>}
    <Outdoors layout={layout} floor={floor}/>
  </group>
}
