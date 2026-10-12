import type { ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Vec3 } from '../office3d-layout.ts'

// Shared low-poly primitives for the tribe scene. Rounded edges and PBR materials keep
// them from looking flat; everything is procedural, so no model files are shipped.
// (The modern office furniture that used to live here was removed with Tribe Mode.)

const roundedCache = new Map<string, THREE.BufferGeometry>()
function roundedGeometry(size: Vec3, radius: number) {
  const key = `${size.join(',')}:${radius}`
  let geometry = roundedCache.get(key)
  if (!geometry) {
    geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(radius, ...size.map((value) => value / 2 - 0.001)))
    roundedCache.set(key, geometry)
  }
  return geometry
}

interface MaterialProps { color: string; roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number; opacity?: number; map?: THREE.Texture }

function Material({ color, roughness = 0.7, metalness = 0, emissive, emissiveIntensity = 0.5, opacity, map }: MaterialProps) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? emissiveIntensity : 0} transparent={opacity !== undefined} opacity={opacity ?? 1} map={map}/>
}

/** Rounded box. */
export function RBox({ position, size, radius = 0.04, rotation, shadow = true, ...material }: { position: Vec3; size: Vec3; radius?: number; rotation?: Vec3; shadow?: boolean } & MaterialProps) {
  return <mesh position={position} rotation={rotation} geometry={roundedGeometry(size, radius)} castShadow={shadow} receiveShadow>
    <Material {...material}/>
  </mesh>
}

export function Cyl({ position, radius, height, rotation, segments = 20, top, ...material }: { position: Vec3; radius: number; height: number; rotation?: Vec3; segments?: number; top?: number } & MaterialProps) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[top ?? radius, radius, height, segments]}/>
    <Material {...material}/>
  </mesh>
}

function Group({ position = [0, 0, 0], rotation = 0, scale = 1, children }: { position?: Vec3; rotation?: number; scale?: number; children: ReactNode }) {
  return <group position={position} rotation={[0, rotation, 0]} scale={scale}>{children}</group>
}

/** A low-poly tree for the forest and the meadow. */
export function Tree({ position, size = 1 }: { position: Vec3; size?: number }) {
  return <Group position={position} scale={size}>
    <Cyl position={[0, 0.9, 0]} radius={0.16} top={0.12} height={1.8} color="#6b4a32" roughness={0.9}/>
    {[[0, 2.2, 0, 1], [0.5, 1.9, 0.2, 0.7], [-0.45, 2.0, -0.2, 0.75], [0.1, 2.7, 0.1, 0.7]].map(([x, y, z, r]) => <mesh key={`${x}${y}`} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]}/><meshStandardMaterial color="#3f7a3c" roughness={0.9} flatShading/></mesh>)}
  </Group>
}
