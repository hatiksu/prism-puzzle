// Трассировка лучей по полю: отражения, светоделители, стены и смешение цветов на кристаллах.
import type { ColorMask, Dir, Level, Piece, Segment, TraceResult } from './types.ts'

const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

/** «/»: вправо → вверх, вверх → вправо, влево → вниз, вниз → влево */
const SLASH: Dir[] = [1, 0, 3, 2]
/** «\»: вправо → вниз, вниз → вправо, влево → вверх, вверх → влево */
const BACKSLASH: Dir[] = [3, 2, 1, 0]

export const reflect = (dir: Dir, r: 0 | 1): Dir => (r === 0 ? SLASH : BACKSLASH)[dir]

/** Индексы поворачиваемых деталей — по ним живёт состояние игры */
export function rotatableIndices(level: Level): number[] {
  return level.pieces.flatMap((p, i) => ((p.t === 'M' || p.t === 'S') && !p.f ? [i] : []))
}

/** Начальные ориентации поворачиваемых деталей */
export function initialState(level: Level): (0 | 1)[] {
  return rotatableIndices(level).map((i) => (level.pieces[i] as { r: 0 | 1 }).r)
}

/**
 * Пускает все лучи и считает, какие цвета дошли до каждой цели.
 * state — ориентации поворачиваемых деталей (в порядке rotatableIndices).
 */
export function trace(level: Level, state: readonly (0 | 1)[]): TraceResult {
  const { w, h, pieces } = level
  const grid = new Array<number>(w * h).fill(-1)
  pieces.forEach((p, i) => {
    grid[p.y * w + p.x] = i
  })

  // Текущие ориентации всех зеркал и делителей
  const orientation = new Map<number, 0 | 1>()
  pieces.forEach((p, i) => {
    if (p.t === 'M' || p.t === 'S') orientation.set(i, p.r)
  })
  rotatableIndices(level).forEach((pi, k) => orientation.set(pi, state[k]))

  const segments: Segment[] = []
  const lit = new Map<number, ColorMask>()
  pieces.forEach((p, i) => {
    if (p.t === 'T') lit.set(i, 0)
  })

  // Один и тот же луч (клетка, направление, цвет) обрабатываем один раз — защита от зацикливания
  const seen = new Set<number>()
  const queue: { x: number; y: number; d: Dir; c: ColorMask }[] = []
  for (const p of pieces) if (p.t === 'E') queue.push({ x: p.x, y: p.y, d: p.d, c: p.c })

  while (queue.length) {
    const beam = queue.pop()!
    const key = ((beam.y * w + beam.x) * 4 + beam.d) * 8 + beam.c
    if (seen.has(key)) continue
    seen.add(key)

    const nx = beam.x + DX[beam.d]
    const ny = beam.y + DY[beam.d]
    const cx = beam.x + 0.5
    const cy = beam.y + 0.5

    // Вылет за поле — луч уходит до края
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
      segments.push({ x1: cx, y1: cy, x2: cx + DX[beam.d] * 0.5, y2: cy + DY[beam.d] * 0.5, c: beam.c })
      continue
    }

    const idx = grid[ny * w + nx]
    const piece: Piece | undefined = idx >= 0 ? pieces[idx] : undefined

    // В стену и в другой источник луч упирается, не доходя до центра клетки
    if (piece && (piece.t === 'W' || piece.t === 'E')) {
      segments.push({ x1: cx, y1: cy, x2: cx + DX[beam.d] * 0.5, y2: cy + DY[beam.d] * 0.5, c: beam.c })
      continue
    }

    segments.push({ x1: cx, y1: cy, x2: nx + 0.5, y2: ny + 0.5, c: beam.c })

    if (!piece) {
      queue.push({ x: nx, y: ny, d: beam.d, c: beam.c })
    } else if (piece.t === 'T') {
      lit.set(idx, lit.get(idx)! | beam.c)
      queue.push({ x: nx, y: ny, d: beam.d, c: beam.c })
    } else if (piece.t === 'M') {
      queue.push({ x: nx, y: ny, d: reflect(beam.d, orientation.get(idx)!), c: beam.c })
    } else if (piece.t === 'S') {
      queue.push({ x: nx, y: ny, d: beam.d, c: beam.c })
      queue.push({ x: nx, y: ny, d: reflect(beam.d, orientation.get(idx)!), c: beam.c })
    }
  }

  let solved = lit.size > 0
  for (const [i, c] of lit) if ((pieces[i] as { c: ColorMask }).c !== c) solved = false
  return { segments, lit, solved }
}
