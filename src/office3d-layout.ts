import type { OfficeStation } from './types.ts'

// Layout of the 3D office (world units ≈ metres, y up, +z towards the street).
// Kept apart from the scene so it can be tested. The office adapts to the crew: there is one
// unlabeled desk per agent (hot desking), and the building grows to the left to fit them.
//
//   z -5 ┌──────────── back wall ────────────┬────┬───────────┐
//   gang │ desks (one per agent, two rows,   │ lounge │ game room │
//  bakso │  growing to the left)             │(TV,sofa)│          │
//   kopi │ meeting table                     │  pantry ├──────────┘
//   z  4 └── low front wall ─── entrance ───────────┘
//        sidewalk · flag      (street food sits in the gang left of the building)
//        road
//
// Lantai 2 sits on the same footprint, FLOOR_HEIGHT up: a dorm bedroom (one bed per agent, above
// the desks), a lesehan corner and a bathroom, reached by the stairs by the entrance, with a
// ruko-style balcony over the front. Positions on lantai 2 have y = FLOOR_HEIGHT.

export type Vec3 = [number, number, number]

/** Glass wall between the workspace and the lounge (back part, up to LOUNGE_PARTITION_END_Z). */
export const PARTITION_X = 0.4
export const LOUNGE_PARTITION_END_Z = -0.5
/** Game room wing right of the building, entered through a door in the lounge wall. */
export const GAME_ROOM = { minX: 9.5, maxX: 15.5, minZ: -5.2, maxZ: 0.6 }
/** Walking line from the lounge lane through the game room door, and the door's extent. */
export const GAME_LANE_Z = -3.7
export const GAME_DOOR = { fromZ: -4.4, toZ: -3.0 }
export const PING_PONG: Vec3 = [12.6, 0, -1.4]
export const ARCADES: Vec3[] = [[10.6, 0, -4.75], [11.6, 0, -4.75]]
export const GAME_TV: Vec3 = [14.2, 0, -5.05]
export const BEANBAGS: Vec3[] = [[13.7, 0, -4.35], [14.7, 0, -4.35]]
export const CARROM: Vec3 = [10.6, 0, -0.1]

/** Walkway in front of the desks; agents walk along it between areas instead of through furniture. */
export const AISLE_Z = 0.4
export const MEETING_TABLE: Vec3 = [-5.2, 0, 2.2]
/** Where the campfire burns: the meeting table's old spot when it fits inside the
 * compound, else the centre. Shared with the ember particles so they rise from the
 * actual fire. */
export function campfirePosition(layout: OfficeLayout): Vec3 {
  const { minX, maxX, minZ, maxZ } = layout.building
  const [mtx, , mtz] = MEETING_TABLE
  return mtx > minX + 2.5 && mtx < maxX - 2.5 && mtz > minZ + 2.5 && mtz < maxZ - 2.5
    ? [mtx, 0, mtz]
    : [(minX + maxX) / 2, 0, (minZ + maxZ) / 2]
}
/** The TV hangs on the back wall; the sofa faces it (backrest towards the aisle). */
export const TV: Vec3 = [4.6, 0, -4.8]
export const SOFA: Vec3 = [4.6, 0, -1.3]
export const LOUNGE_SEATS: Vec3[] = [[4, 0, -1.8], [2.5, 0, -2.9], [6.7, 0, -2.9]]
const LOUNGE_FACING = [Math.PI, Math.PI / 2, -Math.PI / 2]
export const COFFEE_TABLE: Vec3 = [4.6, 0, -2.9]
/** Gap in the low front wall, and the walking line along the sidewalk just outside it. */
export const ENTRANCE_X = 5.8
export const SIDEWALK_Z = 5.4
/** Lounge agents step to this lane first, so they pass between the armchair and the TV. */
export const LOUNGE_LANE_X = 3.1
export const STALL_ROTATION = Math.PI / 2
/** The flag stands at the front-right corner of the grounds, clear of the rooms in view. */
export const FLAG: Vec3 = [16.4, 0, 2.6]

/** Height of lantai 2's floor above the ground. */
export const FLOOR_HEIGHT = 2.8
export type Floor = 1 | 2
export const floorOf = (position: Vec3 | number): Floor => ((typeof position === 'number' ? position : position[1]) > FLOOR_HEIGHT / 2 ? 2 : 1)
/** Straight stairs by the entrance, rising towards -x: lantai 1 at lowX, lantai 2 at highX. */
export const STAIRS = { z: 3.45, width: 0.9, lowX: 4.7, highX: 1.8 }
/** Where agents step on and off the stairs on each floor. */
const STAIRS_FOOT: [number, number] = [5.2, STAIRS.z]
const STAIRS_HEAD: [number, number] = [1.3, STAIRS.z]
/** Balcony over the front of the building, and the sliding door onto it. */
export const BALCONY = { minZ: 4.2, maxZ: 6.6 }
export const BALCONY_DOOR = { fromX: 6.2, toX: 7.4 }
const BALCONY_LANE_Z = 5
export const BALCONY_TABLE: Vec3 = [0.6, FLOOR_HEIGHT, 5.5]
export const HAMMOCK: Vec3 = [4.2, FLOOR_HEIGHT, 5.95]
/** Lesehan corner upstairs: a low table on a carpet with floor cushions around it. */
export const LESEHAN_TABLE: Vec3 = [4.3, FLOOR_HEIGHT, -3]
export const BATHROOM = { minX: 7.6, maxX: 9.5, minZ: -5.2, maxZ: -2.6 }
/** Beds stand above the desk columns, in two rows with their heads to the back wall. */
const BED_ROWS_Z = [-4.1, -1.6]

/** Hot desking: one unlabeled desk per agent, in two rows that grow to the left. */
const DESK_RIGHT_X = -2
const DESK_PITCH = 2.6
const DESK_ROWS_Z = [-3.5, -1]
const MIN_DESK_COLUMNS = 3
/** The stock building (up to six agents) and the scene width the camera is framed for. */
const BASE_MIN_X = -9.5
const BASE_SCENE_WIDTH = 28.7
const CAMERA_OFFSET_BASE: Vec3 = [-3.9, 15.2, 18.8]

/**
 * Where and how an agent is. `pose` lying (bed, hammock: `height` is the surface) or sitting on
 * the floor (lesehan); otherwise standing, or sitting on a chair when `seated`.
 */
export interface Placement { position: Vec3; facing: number; seated: boolean; label?: string; pose?: 'lie' | 'floor'; height?: number }
export interface IdleStop { key: string; label: string; spots: Placement[] }

export interface OfficeLayout {
  deskCount: number
  building: { minX: number; maxX: number; minZ: number; maxZ: number }
  desks: Vec3[]
  /** One bed per agent on lantai 2 (y = FLOOR_HEIGHT). */
  beds: Vec3[]
  /** Walking line up the gang (alley) along the left outside wall, between the wall and the carts. */
  sideLaneX: number
  /** Street food parks in the gang, turned so its stools and customers face the building. */
  baksoCart: Vec3
  kopiBike: Vec3
  gangCenterX: number
  camera: { target: Vec3; offset: Vec3 }
  /** How far the view may be panned (camera target bounds), so the office never leaves the screen. */
  pan: { minX: number; maxX: number; minZ: number; maxZ: number }
  idleStops: IdleStop[]
}

const spot = (x: number, z: number, facing: number, seated = false, label?: string): Placement => ({ position: [x, 0, z], facing, seated, ...(label ? { label } : {}) })
const upstairs = (x: number, z: number, facing: number, extra: Partial<Placement> = {}): Placement => ({ position: [x, FLOOR_HEIGHT, z], facing, seated: false, ...extra })
/** Lying in a bed: feet at the foot end, head on the pillow by the back wall. */
export const bedSpot = ([x, , z]: Vec3, label?: string): Placement => upstairs(x, z + 0.95, 0, { pose: 'lie', height: 0.5, ...(label ? { label } : {}) })

/**
 * Where idle agents spend their time. Each stop has a few spots; idlePlan spreads agents so that
 * no two share a spot while free ones remain. All spots are inside the tribe compound (or on the
 * sleeping floor) — nothing references the old office props.
 */
function idleStops(building: OfficeLayout['building'], beds: Vec3[], deskCount: number): IdleStop[] {
  const { minX, maxX, minZ, maxZ } = building
  const fire = campfirePosition({ building } as OfficeLayout)
  const [fireX, , fireZ] = fire
  const gateX = Math.min(Math.max(ENTRANCE_X, minX + 2.4), maxX - 2.4)
  // Hut row along the back wall (mirrors the TribeCompound layout in environment.tsx).
  const hutCount = Math.min(4, Math.max(2, Math.ceil(deskCount / 2)))
  const hutX = (index: number) => minX + 2.7 + (index * (maxX - minX - 5.4)) / (hutCount - 1)
  const backZ = minZ + 2.0
  const lastHutX = hutX(hutCount - 1)
  const bedXs = beds.map(([x]) => x)
  const loftX = (Math.max(...bedXs) + Math.min(...bedXs)) / 2
  const fireRing: [number, number, number][] = [0.25, 0.75, 1.25, 1.75].map((t) => {
    const angle = t * Math.PI * 2
    const x = fireX + 1.7 * Math.cos(angle)
    const z = fireZ + 1.7 * Math.sin(angle)
    return [x, z, Math.atan2(fireX - x, fireZ - z)]
  })
  return [
    { key: 'tidur', label: 'Tidur di gubuk', spots: beds.map((bed) => bedSpot(bed)) },
    { key: 'api', label: 'Berkumpul dekat api unggun', spots: fireRing.map(([x, z, facing]) => spot(x, z, facing, true)) },
    { key: 'gudang', label: 'Menata perbekalan di gudang', spots: [
      spot(lastHutX - 3.1, backZ + 3.4, Math.PI),
      spot(lastHutX - 1.5, backZ + 3.2, Math.PI),
    ] },
    { key: 'gerbang', label: 'Berjaga di gerbang', spots: [
      spot(gateX - 1.6, maxZ - 1.3, 0),
      spot(gateX + 1.6, maxZ - 1.3, 0),
    ] },
    { key: 'menara', label: 'Mengawasi dari menara', spots: [spot(maxX - 3.4, maxZ - 3.4, Math.PI / 4)] },
    { key: 'loteng', label: 'Beristirahat di loteng gubuk', spots: [upstairs(loftX, 1.8, Math.PI)] },
  ]
}

/** The office for a given number of agents: one desk each, and a building wide enough for them. */
export function createLayout(agentCount: number): OfficeLayout {
  const deskCount = Math.max(1, agentCount)
  const columns = Math.max(MIN_DESK_COLUMNS, Math.ceil(deskCount / DESK_ROWS_Z.length))
  // The back row fills first (right to left), then the front row.
  const desks: Vec3[] = Array.from({ length: deskCount }, (_, index) => {
    const row = index < columns ? 0 : 1
    const column = row === 0 ? index : index - columns
    return [DESK_RIGHT_X - column * DESK_PITCH, 0, DESK_ROWS_Z[row]]
  })
  const minX = DESK_RIGHT_X - (columns - 1) * DESK_PITCH - 2.3
  const shift = minX - BASE_MIN_X
  const building = { minX, maxX: 9.5, minZ: -5.2, maxZ: 4.2 }
  const beds: Vec3[] = desks.map(([x], index) => [x, FLOOR_HEIGHT, BED_ROWS_Z[index < columns ? 0 : 1]])
  const baksoCart: Vec3 = [-11.9 + shift, 0, -2.3]
  const kopiBike: Vec3 = [-11.9 + shift, 0, 1.6]
  const sceneMinX = minX - 3.7
  const scale = (GAME_ROOM.maxX - sceneMinX) / BASE_SCENE_WIDTH
  return {
    deskCount, building, desks, beds, baksoCart, kopiBike,
    sideLaneX: -10.15 + shift,
    gangCenterX: -11.4 + shift,
    camera: { target: [(sceneMinX + GAME_ROOM.maxX) / 2 - 0.15, 0.6, 0.2], offset: CAMERA_OFFSET_BASE.map((value) => value * scale) as Vec3 },
    pan: { minX: sceneMinX - 0.3, maxX: 17, minZ: -7, maxZ: 11 },
    idleStops: idleStops(building, beds, deskCount),
  }
}

const MEETING_RINGS = [
  { radius: 1.4, angles: [Math.PI, 2 * Math.PI, 1.5 * Math.PI, 1.25 * Math.PI, 1.75 * Math.PI] },
  { radius: 2.1, angles: [1.2 * Math.PI, 1.8 * Math.PI, 1.5 * Math.PI, 1.35 * Math.PI, 1.65 * Math.PI] },
]

/** The n-th place at the meeting table (0-based), all on the aisle side so paths never cross it. */
export function meetingSeat(index: number): Placement {
  const slots = MEETING_RINGS.flatMap((ring) => ring.angles.map((angle) => ({ radius: ring.radius, angle })))
  const { radius, angle } = slots[index % slots.length]
  const x = MEETING_TABLE[0] + radius * Math.cos(angle)
  const z = MEETING_TABLE[2] + radius * Math.sin(angle)
  return { position: [x, 0, z], facing: Math.atan2(MEETING_TABLE[0] - x, MEETING_TABLE[2] - z), seated: false }
}

/**
 * Where a station stands: a desk (seat n uses desk n; desks have no names), a place at the
 * meeting table (`meetingIndex` counts the agents already there), or a lounge seat.
 */
export function placementFor(station: OfficeStation, layout: OfficeLayout = DEFAULT_LAYOUT, meetingIndex = 0): Placement {
  const seat = Math.max(station.seat, 1) - 1
  if (station.room === 'Lounge') {
    const [x, y, z] = LOUNGE_SEATS[seat % LOUNGE_SEATS.length]
    return { position: [x, y, z], facing: LOUNGE_FACING[seat % LOUNGE_SEATS.length], seated: true }
  }
  if (station.roomPosition === 'meeting-area') return meetingSeat(meetingIndex)
  const [x, y, z] = layout.desks[seat % layout.desks.length]
  return { position: [x, y, z - 0.75], facing: 0, seated: station.state === 'Working' || station.state === 'Reviewing' }
}

const inGameRoom = ([x, z]: [number, number]) => x > GAME_ROOM.minX && x < GAME_ROOM.maxX && z > GAME_ROOM.minZ && z < GAME_ROOM.maxZ
const inLounge = ([x, z]: [number, number]) => x > 1.5 && x < 7.8 && z < -0.6

/**
 * Waypoints from one spot to another, so agents walk around furniture instead of through it:
 * inside along the aisle (lounge spots via the lounge lane), in or out through the entrance,
 * along the sidewalk, and up the gang's lane to the street food. The last point is always the
 * destination.
 */
export function walkPath(from: [number, number], to: [number, number], layout: OfficeLayout = DEFAULT_LAYOUT): [number, number][] {
  if (Math.hypot(to[0] - from[0], to[1] - from[1]) < 0.3) return [to]
  return simplify(from, groundRoute(from, to, layout), to)
}

function groundRoute(from: [number, number], to: [number, number], layout: OfficeLayout): [number, number][] {
  const { building, sideLaneX } = layout
  const outside = (point: [number, number]) => point[1] > building.maxZ || point[0] < building.minX || (point[0] > building.maxX && !inGameRoom(point))
  const inGang = ([x]: [number, number]) => x < building.minX
  const route: [number, number][] = [from]
  const toAisle = (point: [number, number]): [number, number][] => inGameRoom(point) ? [[point[0], GAME_LANE_Z], [LOUNGE_LANE_X, GAME_LANE_Z], [LOUNGE_LANE_X, AISLE_Z]]
    : inLounge(point) ? [[LOUNGE_LANE_X, point[1]], [LOUNGE_LANE_X, AISLE_Z]] : [[point[0], AISLE_Z]]
  const toSidewalk = (point: [number, number]): [number, number][] => inGang(point) ? [[sideLaneX, point[1]], [sideLaneX, SIDEWALK_Z]] : [[point[0], SIDEWALK_Z]]
  if (!outside(from) && !outside(to)) {
    route.push(...toAisle(from), ...toAisle(to).reverse())
  } else if (inGang(from) && inGang(to)) {
    route.push([sideLaneX, from[1]], [sideLaneX, to[1]])
  } else if (outside(from) && outside(to)) {
    route.push(...toSidewalk(from), ...toSidewalk(to).reverse())
  } else if (outside(to)) {
    route.push(...toAisle(from), [ENTRANCE_X, AISLE_Z], [ENTRANCE_X, SIDEWALK_Z], ...toSidewalk(to).reverse())
  } else {
    route.push(...toSidewalk(from), [ENTRANCE_X, SIDEWALK_Z], [ENTRANCE_X, AISLE_Z], ...toAisle(to).reverse())
  }
  route.push(to)
  return route
}

/** Waypoints on lantai 2: along its aisle, into the bedroom between the bed columns, and out
 * through the sliding door onto the balcony. */
function upperRoute(from: [number, number], to: [number, number], layout: OfficeLayout): [number, number][] {
  const onBalcony = ([, z]: [number, number]) => z > BALCONY.minZ
  const doorX = (BALCONY_DOOR.fromX + BALCONY_DOOR.toX) / 2
  const inBedroom = ([x, z]: [number, number]) => x < PARTITION_X && z < -0.3
  // Beds share columns, so the back row is reached through the gap beside its column.
  const gapX = (x: number) => Math.min(x + DESK_PITCH / 2, PARTITION_X - 0.3)
  const toAisle = (point: [number, number]): [number, number][] => onBalcony(point) ? [[point[0], BALCONY_LANE_Z], [doorX, BALCONY_LANE_Z], [doorX, AISLE_Z]]
    : inBedroom(point) ? [[gapX(point[0]), point[1]], [gapX(point[0]), AISLE_Z]] : [[point[0], AISLE_Z]]
  void layout
  return [from, ...toAisle(from), ...toAisle(to).reverse(), to]
}

/**
 * Waypoints between any two spots, on either floor (y is the floor height). Changing floors goes
 * by the stairs: along the floor to the foot (or head) of the stairs, up (or down) them, and on.
 */
export function walkPath3(from: Vec3, to: Vec3, layout: OfficeLayout = DEFAULT_LAYOUT): Vec3[] {
  const flat = ([x, , z]: Vec3): [number, number] => [x, z]
  const at = (y: number) => ([x, z]: [number, number]): Vec3 => [x, y, z]
  const fromFloor = floorOf(from)
  const toFloor = floorOf(to)
  const route = (floor: Floor, a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.3 ? [b]
    : simplify(a, floor === 1 ? groundRoute(a, b, layout) : upperRoute(a, b, layout), b)
  if (fromFloor === toFloor) return route(fromFloor, flat(from), flat(to)).map(at(fromFloor === 1 ? 0 : FLOOR_HEIGHT)).map((point, index, all) => index === all.length - 1 ? to : point)
  const stairs: Vec3[] = [[STAIRS.lowX, 0, STAIRS.z], [STAIRS.highX, FLOOR_HEIGHT, STAIRS.z]]
  const up = fromFloor === 1
  return [
    ...route(fromFloor, flat(from), up ? STAIRS_FOOT : STAIRS_HEAD).map(at(up ? 0 : FLOOR_HEIGHT)),
    ...(up ? stairs : [...stairs].reverse()),
    ...route(toFloor, up ? STAIRS_HEAD : STAIRS_FOOT, flat(to)).map(at(up ? FLOOR_HEIGHT : 0)).slice(0, -1),
    to,
  ]
}

function simplify(from: [number, number], route: [number, number][], to: [number, number]): [number, number][] {
  // Drop waypoints that do not move the agent somewhere new, then any middle point of three on
  // one straight line (so going out to the aisle and straight back becomes one straight walk).
  const points: [number, number][] = [from]
  for (const point of route.slice(1)) {
    const last = points[points.length - 1]
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) > 0.2) points.push(point)
  }
  const aligned = (a: [number, number], b: [number, number], c: [number, number]) => (Math.abs(a[0] - b[0]) < 0.01 && Math.abs(b[0] - c[0]) < 0.01) || (Math.abs(a[1] - b[1]) < 0.01 && Math.abs(b[1] - c[1]) < 0.01)
  for (let index = 1; index < points.length - 1;) {
    if (aligned(points[index - 1], points[index], points[index + 1])) points.splice(index, 1)
    else index += 1
  }
  const path = points.slice(1)
  if (path.length === 0 || path[path.length - 1] !== to) path.push(to)
  return path
}

/** How long an idle agent stays at one stop (walking included). */
export const IDLE_STOP_MS = 32_000
export const IDLE_ROUTE = ['api', 'gudang', 'gerbang', 'tidur', 'menara', 'api', 'loteng', 'gudang', 'gerbang', 'api', 'menara', 'tidur', 'gudang', 'loteng']

export interface IdleAssignment { stop: IdleStop; placement: Placement }

/**
 * Where each idle agent is at a given time. Purely decorative and deterministic (only the clock
 * and the seats matter, never agent data): each seat starts at a different point of the route, and
 * an agent whose stop is already full moves on along the route, so nobody shares a spot while
 * free ones remain.
 */
export function idlePlan(seats: number[], time: number, layout: OfficeLayout = DEFAULT_LAYOUT, sleepers: number[] = []): Map<number, IdleAssignment> {
  const plan = new Map<number, IdleAssignment>()
  const taken = new Map<string, number>()
  const step = Math.floor(time / IDLE_STOP_MS)
  const stopAt = (index: number) => layout.idleStops.find((item) => item.key === IDLE_ROUTE[index % IDLE_ROUTE.length])!
  // Sleepers (when the viewer sends idle agents to bed) stay in bed; they take the first beds.
  const beds = layout.idleStops.find((item) => item.key === 'tidur')!
  for (const seat of [...sleepers].sort((a, b) => a - b)) {
    const used = taken.get('tidur') ?? 0
    taken.set('tidur', used + 1)
    plan.set(seat, { stop: beds, placement: beds.spots[used % beds.spots.length] })
  }
  for (const seat of [...seats].filter((item) => !plan.has(item)).sort((a, b) => a - b)) {
    const start = step + (Math.max(seat, 1) - 1) * 3
    let stop = stopAt(start)
    for (let offset = 0; offset < IDLE_ROUTE.length; offset += 1) {
      const candidate = stopAt(start + offset)
      if ((taken.get(candidate.key) ?? 0) < candidate.spots.length) { stop = candidate; break }
    }
    const used = taken.get(stop.key) ?? 0
    taken.set(stop.key, used + 1)
    plan.set(seat, { stop, placement: stop.spots[used % stop.spots.length] })
  }
  return plan
}

/** One idle agent on its own. */
export function idleStop(seat: number, time: number, layout: OfficeLayout = DEFAULT_LAYOUT): IdleAssignment {
  return idlePlan([seat], time, layout).get(seat)!
}

/** Keeps a panned camera target inside the office grounds. */
export function clampTarget(x: number, z: number, bounds: OfficeLayout['pan'] = DEFAULT_LAYOUT.pan): [number, number] {
  return [Math.min(Math.max(x, bounds.minX), bounds.maxX), Math.min(Math.max(z, bounds.minZ), bounds.maxZ)]
}

/** The stock office (three agents), for callers that do not know the crew size. */
export const DEFAULT_LAYOUT = createLayout(3)
export const BUILDING = DEFAULT_LAYOUT.building
export const SIDE_LANE_X = DEFAULT_LAYOUT.sideLaneX
export const PAN_BOUNDS = DEFAULT_LAYOUT.pan
export const IDLE_STOPS = DEFAULT_LAYOUT.idleStops
export const DESKS = DEFAULT_LAYOUT.desks
