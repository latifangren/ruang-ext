import * as THREE from 'three'

// Procedural canvas textures, so the 3D office ships without image or model files.
// Each texture is created once and cached.

const cache = new Map<string, THREE.Texture>()

function canvasTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.Texture {
  const cached = cache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(...repeat)
  }
  cache.set(key, texture)
  return texture
}

/** Deterministic pseudo-random numbers so textures look the same on every load. */
function random(seed: number) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

/** Warm parquet planks (like the reference office floor). */
export function woodFloor(repeat: [number, number]) {
  return canvasTexture(`wood-${repeat.join('x')}`, 512, 512, (ctx) => {
    const rand = random(7)
    const tones = ['#b98355', '#a9744a', '#c48f5f', '#b07b4f', '#9f6c43']
    const plankH = 64
    for (let row = 0; row < 512 / plankH; row += 1) {
      let x = row % 2 === 0 ? 0 : -96
      while (x < 512) {
        const width = 128 + Math.floor(rand() * 96)
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)]
        ctx.fillRect(x, row * plankH, width, plankH)
        ctx.strokeStyle = 'rgba(60,35,20,0.18)'
        for (let grain = 0; grain < 5; grain += 1) {
          const y = row * plankH + 8 + rand() * (plankH - 16)
          ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.bezierCurveTo(x + width / 3, y + 3, x + (2 * width) / 3, y - 3, x + width - 4, y); ctx.stroke()
        }
        ctx.fillStyle = 'rgba(50,28,15,0.55)'
        ctx.fillRect(x, row * plankH, 2, plankH)
        x += width
      }
      ctx.fillStyle = 'rgba(50,28,15,0.5)'
      ctx.fillRect(0, row * plankH, 512, 2)
    }
  }, repeat)
}

/** Light ceramic tiles for the pantry. */
export function tileFloor(repeat: [number, number]) {
  return canvasTexture(`tile-${repeat.join('x')}`, 256, 256, (ctx) => {
    ctx.fillStyle = '#e9e4da'; ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#d6cfc2'
    for (let i = 0; i <= 256; i += 64) { ctx.fillRect(i - 1, 0, 2, 256); ctx.fillRect(0, i - 1, 256, 2) }
  }, repeat)
}

export function carpet(color: string, repeat: [number, number]) {
  return canvasTexture(`carpet-${color}-${repeat.join('x')}`, 128, 128, (ctx) => {
    const rand = random(11)
    ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128)
    for (let i = 0; i < 900; i += 1) { ctx.fillStyle = `rgba(0,0,0,${rand() * 0.08})`; ctx.fillRect(rand() * 128, rand() * 128, 1, 1) }
  }, repeat)
}

export function grass(repeat: [number, number]) {
  return canvasTexture(`grass-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(3)
    ctx.fillStyle = '#5d8f4e'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2600; i += 1) {
      const shade = 70 + Math.floor(rand() * 60)
      ctx.fillStyle = `rgb(${shade - 25},${shade + 55},${shade - 30})`
      ctx.fillRect(rand() * 256, rand() * 256, 2, 3)
    }
  }, repeat)
}

export function asphalt(repeat: [number, number]) {
  return canvasTexture(`asphalt-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(5)
    ctx.fillStyle = '#3d4044'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 3000; i += 1) { const g = 50 + Math.floor(rand() * 40); ctx.fillStyle = `rgb(${g},${g},${g + 4})`; ctx.fillRect(rand() * 256, rand() * 256, 1.5, 1.5) }
    ctx.fillStyle = '#e8dfa0'
    ctx.fillRect(0, 124, 110, 8); ctx.fillRect(146, 124, 110, 8)
  }, repeat)
}

export function pavingStones(repeat: [number, number]) {
  return canvasTexture(`paving-${repeat.join('x')}`, 256, 256, (ctx) => {
    ctx.fillStyle = '#b8b2a6'; ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#a19b8f'
    for (let y = 0; y < 256; y += 32) {
      ctx.fillRect(0, y, 256, 2)
      for (let x = (y / 32) % 2 === 0 ? 0 : 32; x < 256; x += 64) ctx.fillRect(x, y, 2, 32)
    }
  }, repeat)
}

/** Painted street-food sign: bold text on a coloured board. */
export function signTexture(text: string, background: string, foreground: string, subtitle?: string) {
  return canvasTexture(`sign-${text}-${background}-${subtitle ?? ''}`, 512, 160, (ctx) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 160)
    ctx.strokeStyle = foreground; ctx.lineWidth = 8; ctx.strokeRect(10, 10, 492, 140)
    ctx.fillStyle = foreground
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = 'bold 76px Georgia, "Times New Roman", serif'
    ctx.fillText(text, 256, subtitle ? 66 : 82)
    if (subtitle) { ctx.font = 'bold 30px Arial, sans-serif'; ctx.fillText(subtitle, 256, 124) }
  })
}

/** The Indonesian flag: red over white. */
export function merahPutih() {
  return canvasTexture('merah-putih', 96, 64, (ctx) => {
    ctx.fillStyle = '#ce1126'; ctx.fillRect(0, 0, 96, 32)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 32, 96, 32)
  })
}

export function screenTexture(active: boolean) {
  return canvasTexture(`screen-${active}`, 128, 80, (ctx) => {
    ctx.fillStyle = active ? '#15313a' : '#0d1112'; ctx.fillRect(0, 0, 128, 80)
    if (!active) return
    const rand = random(13)
    for (let line = 0; line < 9; line += 1) {
      ctx.fillStyle = ['#7ee0c3', '#f2c58a', '#a9d4ff', '#e7e7e7'][line % 4]
      ctx.fillRect(8 + (line % 3) * 6, 8 + line * 7.5, 30 + rand() * 70, 3)
    }
  })
}

/** A retro game on the arcade screens: a grid of bricks, a paddle and a ball. */
export function arcadeScreen() {
  return canvasTexture('arcade-screen', 128, 100, (ctx) => {
    ctx.fillStyle = '#0b1026'; ctx.fillRect(0, 0, 128, 100)
    const colors = ['#e63946', '#f4a261', '#f4d35e', '#2a9d8f', '#3a86ff']
    colors.forEach((color, row) => { ctx.fillStyle = color; for (let col = 0; col < 8; col += 1) ctx.fillRect(6 + col * 15, 10 + row * 7, 13, 5) })
    ctx.fillStyle = '#ffffff'; ctx.fillRect(52, 88, 26, 4); ctx.fillRect(70, 64, 4, 4)
  })
}


/* ---------------------------------- Tribe Mode ---------------------------------- */
/** Primitive-village textures below. All earthy, muted; no modern or neon elements. */

/** Layered thatch straw for hut roofs: horizontal overlapping strands. */
export function thatch(repeat: [number, number]) {
  return canvasTexture(`thatch-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(21)
    const tones = ['#b89a5e', '#a3854a', '#c9ab6b']
    ctx.fillStyle = '#a3854a'; ctx.fillRect(0, 0, 256, 256)
    for (let layer = 0; layer < 16; layer += 1) {
      const y = layer * 16
      ctx.fillStyle = 'rgba(60,40,18,0.45)'
      ctx.fillRect(0, y, 256, 3)
      for (let s = 0; s < 42; s += 1) {
        ctx.strokeStyle = tones[Math.floor(rand() * tones.length)]
        ctx.lineWidth = 1.5 + rand() * 1.5
        const sx = rand() * 256
        const sy = y + 3 + rand() * 13
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (rand() - 0.3) * 40, sy + 2 + rand() * 6); ctx.stroke()
      }
    }
    for (let i = 0; i < 500; i += 1) {
      ctx.fillStyle = `rgba(40,26,10,${rand() * 0.25})`
      ctx.fillRect(rand() * 256, rand() * 256, 2, 1)
    }
  }, repeat)
}

/** Irregular rough stones with dark gaps (no tidy grid): for walls and fire pits. */
export function roughStone(repeat: [number, number]) {
  return canvasTexture(`rough-stone-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(33)
    const tones = ['#8a8578', '#7a7568', '#98938a']
    ctx.fillStyle = '#43403a'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 46; i += 1) {
      const cx = rand() * 256, cy = rand() * 256
      const rx = 14 + rand() * 30, ry = 10 + rand() * 22
      ctx.fillStyle = tones[Math.floor(rand() * tones.length)]
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,250,240,0.10)'
      ctx.beginPath(); ctx.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.6, ry * 0.55, 0, 0, Math.PI * 2); ctx.fill()
    }
    for (let i = 0; i < 900; i += 1) {
      const g = 100 + Math.floor(rand() * 40)
      ctx.fillStyle = `rgba(${g},${g - 4},${g - 10},${0.25 * rand()})`
      ctx.fillRect(rand() * 256, rand() * 256, 1.5, 1.5)
    }
  }, repeat)
}

/** Packed dirt ground with speckles and tufts of dry grass. */
export function dirtGround(repeat: [number, number]) {
  return canvasTexture(`dirt-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(45)
    const tones = ['#7a5c3e', '#6b4f34', '#86653f']
    ctx.fillStyle = '#7a5c3e'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2400; i += 1) {
      ctx.fillStyle = tones[Math.floor(rand() * tones.length)]
      ctx.globalAlpha = 0.35 + rand() * 0.4
      ctx.fillRect(rand() * 256, rand() * 256, 2 + rand() * 2, 2 + rand() * 2)
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#b3a05f'; ctx.lineWidth = 1.4
    for (let i = 0; i < 90; i += 1) {
      const x = rand() * 256, y = rand() * 256
      for (let b = 0; b < 4; b += 1) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rand() - 0.5) * 10, y - 4 - rand() * 8); ctx.stroke()
      }
    }
  }, repeat)
}

/** Packed gravel for the footpath: warm dirt with pale pebbles. */
export function gravel(repeat: [number, number]) {
  return canvasTexture(`gravel-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(23)
    ctx.fillStyle = '#8a6f4d'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 700; i += 1) {
      const g = 120 + Math.floor(rand() * 70)
      ctx.fillStyle = `rgb(${g},${g - 12},${g - 30})`
      ctx.beginPath(); ctx.arc(rand() * 256, rand() * 256, 1.5 + rand() * 3, 0, Math.PI * 2); ctx.fill()
    }
  }, repeat)
}

/** Rough wooden planks for stilt-house floors and walkways. */
export function planks(repeat: [number, number]) {
  return canvasTexture(`planks-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(29)
    const tones = ['#8a6a42', '#7d5f3b', '#93714a', '#84643f']
    for (let row = 0; row < 4; row += 1) {
      ctx.fillStyle = tones[row % tones.length]; ctx.fillRect(0, row * 64, 256, 64)
      ctx.fillStyle = 'rgba(40,24,12,0.5)'; ctx.fillRect(0, row * 64, 256, 3)
      for (let g = 0; g < 4; g += 1) {
        ctx.strokeStyle = 'rgba(60,38,20,0.25)'; ctx.lineWidth = 1.2
        const y = row * 64 + 10 + rand() * 44
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y + (rand() - 0.5) * 8); ctx.stroke()
      }
      ctx.fillStyle = 'rgba(40,24,12,0.55)'
      ctx.fillRect((row * 97) % 256, row * 64, 3, 64)
    }
  }, repeat)
}

/** Draw a simple hand stencil (palm + fingers) in cave-painting style. */
function drawHandStencil(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, flip: boolean) {
  const s = flip ? -1 : 1
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.55, size * 0.7, 0, 0, Math.PI * 2); ctx.fill()
  const angles = [-0.9, -0.45, 0, 0.45, 0.9]
  angles.forEach((a, i) => {
    const len = size * (0.9 - Math.abs(a) * 0.25 - (i === 4 ? 0.25 : 0))
    const fx = cx + Math.sin(a) * size * 0.45 * s
    const fy = cy - size * 0.65
    ctx.lineWidth = size * 0.16; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.sin(a) * len * s, fy - Math.cos(a) * len); ctx.stroke()
  })
}

/** Cave-painting panel: ochre hand stencils, a mammoth silhouette and symbols on dark stone. */
export function cavePainting() {
  return canvasTexture('cave-painting', 512, 512, (ctx) => {
    const rand = random(57)
    ctx.fillStyle = '#57534a'; ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 60; i += 1) {
      const cx = rand() * 512, cy = rand() * 512
      ctx.fillStyle = ['#4c4840', '#615c52', '#4a463d'][Math.floor(rand() * 3)]
      ctx.beginPath(); ctx.ellipse(cx, cy, 18 + rand() * 40, 14 + rand() * 30, rand() * Math.PI, 0, Math.PI * 2); ctx.fill()
    }
    const ochre = '#c1622f', dark = '#a34d24'
    ctx.globalAlpha = 0.9
    drawHandStencil(ctx, 120, 140, 46, ochre, false)
    drawHandStencil(ctx, 396, 170, 40, dark, true)
    drawHandStencil(ctx, 300, 400, 44, ochre, false)
    ctx.globalAlpha = 0.85
    ctx.fillStyle = dark
    ctx.beginPath(); ctx.ellipse(190, 300, 90, 46, -0.06, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(262, 262, 34, 30, 0.2, 0, Math.PI * 2); ctx.fill()
    ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.strokeStyle = dark
    ;[[150, 340], [185, 344], [220, 344], [245, 340]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 52); ctx.stroke()
    })
    ctx.lineWidth = 10
    ctx.beginPath(); ctx.moveTo(288, 258); ctx.quadraticCurveTo(308, 290, 300, 330); ctx.stroke()
    ctx.lineWidth = 5; ctx.strokeStyle = ochre
    ctx.beginPath(); ctx.moveTo(276, 250); ctx.quadraticCurveTo(292, 240, 310, 236); ctx.stroke()
    ctx.lineWidth = 7; ctx.strokeStyle = dark
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(90, 430 + i * 16); ctx.lineTo(170 + rand() * 40, 424 + i * 16); ctx.stroke()
    }
    for (let i = 0; i < 4; i += 1) {
      const x = 420 + rand() * 60, y = 300 + rand() * 120
      ctx.fillStyle = i % 2 === 0 ? ochre : dark
      ctx.beginPath(); ctx.arc(x, y, 5 + rand() * 6, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  })
}

/** Woven banner cloth: dark brown with a stitched border and one big white handprint. */
export function bannerCloth() {
  return canvasTexture('banner-cloth', 256, 384, (ctx) => {
    const rand = random(69)
    ctx.fillStyle = '#5a3d26'; ctx.fillRect(0, 0, 256, 384)
    for (let y = 0; y < 384; y += 4) {
      ctx.fillStyle = `rgba(0,0,0,${0.04 + rand() * 0.05})`
      ctx.fillRect(0, y, 256, 2)
    }
    ctx.strokeStyle = '#c9ab6b'; ctx.lineWidth = 10
    ctx.setLineDash([18, 10])
    ctx.strokeRect(16, 16, 224, 352)
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(230,220,205,0.9)'
    drawHandStencil(ctx, 128, 192, 84, 'rgba(230,220,205,0.9)', false)
  })
}

/** River water: blue-green with bright horizontal ripple lines; wraps on both axes. */
export function waterTex(repeat: [number, number]) {
  return canvasTexture(`water-${repeat.join('x')}`, 256, 256, (ctx) => {
    const rand = random(81)
    ctx.fillStyle = '#3d6b7a'; ctx.fillRect(0, 0, 256, 256)
    const tones = ['#4a7d8c', '#35616e', '#548b99']
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = tones[i % tones.length]; ctx.globalAlpha = 0.25
      ctx.fillRect(0, (i * 256) / 5, 256, 256 / 5)
    }
    ctx.globalAlpha = 1
    ctx.lineWidth = 2.5
    for (let row = 0; row < 8; row += 1) {
      const yBase = row * 32 + 10 + rand() * 8
      ctx.strokeStyle = row % 2 === 0 ? 'rgba(170,220,230,0.55)' : 'rgba(140,190,205,0.35)'
      for (let seg = 0; seg < 6; seg += 1) {
        const x0 = seg * (256 / 6)
        ctx.beginPath()
        for (let x = 0; x <= 256 / 6; x += 4) {
          const px = x0 + x
          const py = yBase + Math.sin((x / (256 / 6)) * Math.PI * 2 + row) * 5 + rand() * 2
          if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
    }
    for (let i = 0; i < 260; i += 1) {
      ctx.fillStyle = `rgba(200,235,242,${rand() * 0.22})`
      ctx.fillRect(rand() * 256, rand() * 256, 1.5, 1.5)
    }
  }, repeat)
}

/** Dark animal fur: short random-direction strokes over brown. */
export function furTex() {
  return canvasTexture('fur', 256, 256, (ctx) => {
    const rand = random(93)
    ctx.fillStyle = '#5a4028'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2400; i += 1) {
      const light = rand() > 0.5
      ctx.strokeStyle = light ? 'rgba(190,150,100,0.5)' : 'rgba(30,20,10,0.5)'
      ctx.lineWidth = 1.2
      const x = rand() * 256, y = rand() * 256
      const a = rand() * Math.PI * 2, len = 4 + rand() * 9
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke()
    }
  })
}

/** 128x128 radial fire glow: white-hot core fading through yellow/orange to transparent. */
export function flameSprite() {
  return canvasTexture('flame-sprite', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
    g.addColorStop(0, 'rgba(255,255,240,1)')
    g.addColorStop(0.25, 'rgba(255,230,150,0.95)')
    g.addColorStop(0.5, 'rgba(255,160,60,0.7)')
    g.addColorStop(0.75, 'rgba(220,100,30,0.28)')
    g.addColorStop(1, 'rgba(160,60,20,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  })
}
