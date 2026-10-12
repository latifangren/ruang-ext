import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { campfirePosition, ENTRANCE_X, FLOOR_HEIGHT, type Floor as FloorNumber, type OfficeLayout, STAIRS, type Vec3 } from '../office3d-layout.ts'
import { Cyl, RBox, Tree } from './props.tsx'
import { dirtGround, grass, waterTex } from './textures.ts'
import { Banner, Basket, Campfire, CavePainting, ClayPot, Fern, FirewoodStack, FurBedroll, HideRack, Hut, Ladder, Mammoth, Palisade, Rocks, StoneWall, TimberGate, Torch, Watchtower } from './tribe.tsx'

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

/** Lantai 1: the tribe compound — palisade, gate, campfire, huts and torches. */
function TribeCompound({ night, layout }: { night: boolean; layout: OfficeLayout }) {
  const { minX, maxX, minZ, maxZ } = layout.building
  const dirt = useMemo(() => dirtGround([6, 4]), [])
  const gateX = Math.min(Math.max(ENTRANCE_X, minX + 2.4), maxX - 2.4)
  const gateHalf = 1.7
  const fire = campfirePosition(layout)
  const [fireX, , fireZ] = fire
  // 2-4 huts along the back, growing with the crew, clear of the fire.
  const hutCount = Math.min(4, Math.max(2, Math.ceil(layout.deskCount / 2)))
  const hutX = (index: number) => hutCount === 1 ? (minX + maxX) / 2 : minX + 2.7 + (index * (maxX - minX - 5.4)) / (hutCount - 1)
  const backZ = minZ + 2.0
  const lastHutX = hutX(hutCount - 1)
  return <group>
    <Floor position={[(minX + maxX) / 2, 0.005, (minZ + maxZ) / 2]} size={[maxX - minX + 6, maxZ - minZ + 6]} map={dirt} roughness={1}/>
    {/* Palisade: full height at the back and sides, low towards the camera (cut-away) */}
    <Palisade from={[minX, minZ]} to={[maxX, minZ]} height={2.6}/>
    <Palisade from={[minX, minZ]} to={[minX, maxZ]} height={2.6}/>
    <Palisade from={[maxX, minZ]} to={[maxX, maxZ]} height={2.6}/>
    <Palisade from={[minX, maxZ]} to={[gateX - gateHalf, maxZ]} height={1.15}/>
    <Palisade from={[gateX + gateHalf, maxZ]} to={[maxX, maxZ]} height={1.15}/>
    <TimberGate position={[gateX, 0, maxZ]}/>
    <Campfire position={fire} night={night}/>
    {Array.from({ length: hutCount }, (_, index) => <Hut key={index} position={[hutX(index), 0, backZ]} size={[3.6, 1.5, 3.2]}/>)}
    {/* Storage corner by the last hut: firewood, hides, pots and a basket */}
    <FirewoodStack position={[lastHutX - 3.1, 0, backZ + 1.9]} rotation={0.3}/>
    <HideRack position={[lastHutX - 3.1, 0, backZ + 0.1]} rotation={Math.PI / 2}/>
    <ClayPot position={[lastHutX - 1.7, 0, backZ + 2.3]}/>
    <Basket position={[lastHutX - 1.0, 0, backZ + 2.0]}/>
    <Watchtower position={[maxX - 1.9, 0, maxZ - 1.9]}/>
    {/* The ladder up to the sleeping floor, where the stairs stood */}
    <Ladder position={[2.0, 0, STAIRS.z]} height={FLOOR_HEIGHT} rotation={Math.PI / 2}/>
    {/* Torches: the two by the gate and the fire carry lights (3 point lights total) */}
    <Torch position={[gateX - 2.3, 0, maxZ - 0.7]} withLight night={night}/>
    <Torch position={[fireX + 2.3, 0, fireZ + 1.4]} withLight night={night}/>
    <Torch position={[minX + 1.1, 0, maxZ - 1.1]} night={night}/>
    <Torch position={[minX + 4.6, 0, minZ + 0.65]} night={night}/>
  </group>
}

/** Lantai 2: the sleeping floor — a slab on posts with a longhouse of fur bedrolls. */
function SleepingQuarters({ night, layout }: { night: boolean; layout: OfficeLayout }) {
  const { minX, maxX, minZ, maxZ } = layout.building
  const dirt = useMemo(() => dirtGround([5, 3]), [])
  // The slab, leaving the ladder hole open: [minX, maxX, minZ, maxZ] pieces.
  const hole = { minX: 1.2, maxX: 2.8, minZ: STAIRS.z - 0.55, maxZ: STAIRS.z + 0.55 }
  const slab: [number, number, number, number][] = [
    [minX, maxX, minZ, hole.minZ], [minX, hole.minX, hole.minZ, hole.maxZ], [hole.maxX, maxX, hole.minZ, hole.maxZ], [minX, maxX, hole.maxZ, maxZ],
  ]
  // The sleeping longhouse encloses the beds.
  const bedXs = layout.beds.map(([x]) => x)
  const hutW = Math.max(...bedXs) - Math.min(...bedXs) + 3.4
  const hutX = (Math.max(...bedXs) + Math.min(...bedXs)) / 2
  const hutZ = -2.5
  const posts: [number, number][] = [
    [minX + 0.6, minZ + 0.6], [maxX - 0.6, minZ + 0.6], [minX + 0.6, maxZ - 0.6], [maxX - 0.6, maxZ - 0.6],
    [(minX + maxX) / 2, minZ + 0.6], [(minX + maxX) / 2, maxZ - 0.6],
  ]
  return <group>
    {posts.map(([x, z]) => <Cyl key={`${x},${z}`} position={[x, FLOOR_HEIGHT / 2, z]} radius={0.16} height={FLOOR_HEIGHT} color="#5a3d26" roughness={0.95}/>)}
    <group position={[0, FLOOR_HEIGHT, 0]}>
      {slab.map(([x1, x2, z1, z2]) => <RBox key={`${x1},${z1}`} position={[(x1 + x2) / 2, -0.11, (z1 + z2) / 2]} size={[x2 - x1, 0.22, z2 - z1]} radius={0.01} color="#8a7a63"/>)}
      {slab.map(([x1, x2, z1, z2]) => <Floor key={`f${x1},${z1}`} position={[(x1 + x2) / 2, 0.005, (z1 + z2) / 2]} size={[x2 - x1, z2 - z1]} map={dirt} roughness={1}/>)}
      <Hut position={[hutX, 0, hutZ]} size={[hutW, 1.7, 5.0]}/>
      {layout.beds.map(([x, , z], index) => <FurBedroll key={index} position={[x, 0.01, z + 0.2]}/>)}
      <Torch position={[minX + 1.6, 0, maxZ - 1.6]} night={night}/>
      <Torch position={[hutX + hutW / 2 + 1.2, 0, hutZ + 1.6]} night={night}/>
    </group>
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

/** The wilderness around the compound: meadow, river, forest and a distant mammoth. */
function Outdoors({ layout }: { layout: OfficeLayout }) {
  // How far the building grew to the left for a larger crew; the grounds grow with it.
  const shift = layout.building.minX + 9.5
  const { minX, maxX, maxZ } = layout.building
  const lawn = useMemo(() => grass([14, 12]), [])
  const apron = useMemo(() => dirtGround([3, 3]), [])
  const gateX = Math.min(Math.max(ENTRANCE_X, minX + 2.4), maxX - 2.4)
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
    {/* Meadow, with a packed-dirt apron in front of the gate */}
    <Floor position={[shift / 2, -0.02, 2]} size={[groundWidth, 44]} map={lawn} roughness={1}/>
    <Floor position={[gateX, -0.01, 7]} size={[7, 6]} map={apron} roughness={1}/>
    <River width={groundWidth}/>
    {trees.map(([x, z, size]) => <Tree key={`${x},${z}`} position={[x, 0, z]} size={size}/>)}
    <Rocks positions={rocks}/>
    {ferns.map(([x, , z]) => <Fern key={`${x},${z}`} position={[x, 0, z]}/>)}
    {/* A mammoth grazing on the far bank, small in the frame */}
    <Mammoth position={[7, 0, -16]} rotation={-0.5}/>
    {/* Gate vignette: a banner and a rock-art panel */}
    <Banner position={[gateX - 2.4, 0, maxZ + 0.8]}/>
    <StoneWall from={[gateX + 1.0, maxZ + 1.2]} to={[gateX + 3.4, maxZ + 1.2]} height={1.2}/>
    <CavePainting position={[gateX + 2.2, 0.62, maxZ + 1.36]} width={2}/>
  </group>
}

/** The grounds plus the floor in view: lantai 1 as a cut-away tribe compound, or lantai 2 the sleeping floor above it. */
export function Environment({ night = false, layout, floor = 1 }: { night?: boolean; layout: OfficeLayout; floor?: FloorNumber }) {
  return <group>
    {floor === 1 ? <TribeCompound night={night} layout={layout}/> : <SleepingQuarters night={night} layout={layout}/>}
    <Outdoors layout={layout}/>
  </group>
}
