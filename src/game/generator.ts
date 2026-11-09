// Генератор уровней. Решаемость гарантирована построением: сначала выбираем «правильные» ориентации,
// пускаем лучи и ставим кристаллы туда, куда они дошли, — потом запутываем начальную позицию.
// Решатель отбраковывает слишком простые уровни и уровни с кучей решений.
import { createRng, type Rng } from './rng.ts'
import { allSolutions, analyze } from './solver.ts'
import { rotatableIndices, trace } from './trace.ts'
import { BLUE, GREEN, RED, type Dir, type Level, type Piece } from './types.ts'

export interface GenOptions {
  w: number
  h: number
  emitters: number
  mirrors: number
  splitters: number
  walls: number
  targets: number
  /** Минимум касаний до решения */
  minMoves: number
  /** Максимум разных решений (чем меньше, тем «чище» головоломка) */
  maxSolutions: number
}

const key = (x: number, y: number) => `${x},${y}`

function placeEmitters(rng: Rng, o: GenOptions, used: Set<string>): Piece[] {
  const colors = rng.shuffle([RED, GREEN, BLUE])
  const out: Piece[] = []
  let guard = 0
  while (out.length < o.emitters && guard++ < 200) {
    // Источник на краю поля, светит внутрь
    const side = rng.int(0, 3)
    let x = 0
    let y = 0
    let d: Dir = 1
    if (side === 0) [x, y, d] = [rng.int(1, o.w - 2), 0, 2]
    else if (side === 1) [x, y, d] = [o.w - 1, rng.int(1, o.h - 2), 3]
    else if (side === 2) [x, y, d] = [rng.int(1, o.w - 2), o.h - 1, 0]
    else [x, y, d] = [0, rng.int(1, o.h - 2), 1]
    if (used.has(key(x, y))) continue
    used.add(key(x, y))
    out.push({ t: 'E', x, y, d, c: colors[out.length % 3] })
  }
  return out
}

function emptyInterior(o: GenOptions, used: Set<string>): [number, number][] {
  const cells: [number, number][] = []
  for (let y = 1; y < o.h - 1; y++) for (let x = 1; x < o.w - 1; x++) if (!used.has(key(x, y))) cells.push([x, y])
  return cells
}

/** Одна попытка построить уровень; null — не вышло, пробуем снова */
function attempt(rng: Rng, o: GenOptions, id: number): Level | null {
  const used = new Set<string>()
  const pieces: Piece[] = placeEmitters(rng, o, used)
  if (pieces.length < o.emitters) return null

  const free = rng.shuffle(emptyInterior(o, used))
  for (let i = 0; i < o.mirrors + o.splitters && free.length; i++) {
    const [x, y] = free.pop()!
    used.add(key(x, y))
    pieces.push({ t: i < o.mirrors ? 'M' : 'S', x, y, r: rng.next() < 0.5 ? 0 : 1 })
  }

  // «Правильные» ориентации
  const draft: Level = { id, w: o.w, h: o.h, pieces, optimal: 0, solution: [] }
  const rot = rotatableIndices(draft)
  const solution = rot.map(() => (rng.next() < 0.5 ? 0 : 1) as 0 | 1)
  rot.forEach((pi, k) => ((pieces[pi] as { r: 0 | 1 }).r = solution[k]))

  // Клетки, через которые прошли лучи, и какие цвета там
  const result = trace(draft, solution)
  const cellColors = new Map<string, number>()
  const cellOrder: string[] = []
  for (const s of result.segments) {
    const x = Math.floor(s.x2)
    const y = Math.floor(s.y2)
    // Конец отрезка в центре клетки (а не на краю) — луч в этой клетке был
    if (s.x2 % 1 !== 0.5 || s.y2 % 1 !== 0.5) continue
    const k = key(x, y)
    if (used.has(k)) continue
    if (!cellColors.has(k)) cellOrder.push(k)
    cellColors.set(k, (cellColors.get(k) ?? 0) | s.c)
  }
  if (cellOrder.length < o.targets) return null

  // Цели: предпочитаем смешанные цвета и клетки подальше от источников; не вплотную друг к другу
  const candidates = cellOrder
    .map((k, order) => ({ k, c: cellColors.get(k)!, score: order + (cellColors.get(k)! & (cellColors.get(k)! - 1) ? 20 : 0) + rng.next() * 6 }))
    .sort((a, b) => b.score - a.score)
  const targets: Piece[] = []
  for (const cand of candidates) {
    if (targets.length >= o.targets) break
    const [x, y] = cand.k.split(',').map(Number)
    if (targets.some((t) => Math.abs(t.x - x) + Math.abs(t.y - y) < 2)) continue
    targets.push({ t: 'T', x, y, c: cand.c })
    used.add(cand.k)
  }
  if (targets.length < o.targets) return null
  pieces.push(...targets)

  // Стены — на клетках, где в решении лучей нет (мешают только неправильным вариантам)
  const wallSpots = rng.shuffle(emptyInterior(o, used).filter(([x, y]) => !cellColors.has(key(x, y))))
  for (let i = 0; i < o.walls && wallSpots.length; i++) {
    const [x, y] = wallSpots.pop()!
    pieces.push({ t: 'W', x, y })
  }

  // Проверяем качество через решатель
  const level: Level = { id, w: o.w, h: o.h, pieces, optimal: 0, solution }
  const solutions = allSolutions(level)
  if (solutions.length === 0 || solutions.length > o.maxSolutions) return null

  // Запутываем: начальная позиция — далеко от всех решений
  const start = rot.map(() => (rng.next() < 0.5 ? 0 : 1) as 0 | 1)
  const { moves, nearest } = analyze(level, start, solutions)
  if (moves < o.minMoves || !nearest) return null
  rot.forEach((pi, k) => ((pieces[pi] as { r: 0 | 1 }).r = start[k]))

  return { ...level, optimal: moves, solution: nearest }
}

export function generateLevel(seed: number, o: GenOptions, id: number, maxAttempts = 4000): Level | null {
  const rng = createRng(seed)
  for (let i = 0; i < maxAttempts; i++) {
    const level = attempt(rng, o, id)
    if (level) return level
  }
  return null
}

/** Параметры по номеру уровня: от 5×5 с одним лучом до 7×8 с тремя цветами и делителями */
export function optionsFor(n: number): GenOptions {
  if (n <= 3) return { w: 5, h: 5, emitters: 1, mirrors: 3, splitters: 0, walls: 1, targets: 1, minMoves: 1 + Math.min(n, 2), maxSolutions: 2 }
  if (n <= 6) return { w: 5, h: 6, emitters: 1, mirrors: 4, splitters: 1, walls: 2, targets: 2, minMoves: 3, maxSolutions: 2 }
  if (n <= 10) return { w: 6, h: 6, emitters: 2, mirrors: 5, splitters: 1, walls: 2, targets: 2, minMoves: 4, maxSolutions: 2 }
  if (n <= 15) return { w: 6, h: 7, emitters: 2, mirrors: 6, splitters: 2, walls: 3, targets: 3, minMoves: 5, maxSolutions: 2 }
  if (n <= 20) return { w: 7, h: 7, emitters: 3, mirrors: 7, splitters: 2, walls: 3, targets: 3, minMoves: 6, maxSolutions: 2 }
  return { w: 7, h: 8, emitters: 3, mirrors: 8, splitters: 3, walls: 4, targets: 4, minMoves: 7, maxSolutions: 1 }
}
