// Решатель: перебирает все ориентации поворачиваемых деталей (у каждой их две) и находит решения.
// Касание поворачивает одну деталь, поэтому минимум ходов — наименьшее число отличий от решения.
import { initialState, rotatableIndices, trace } from './trace.ts'
import type { Level } from './types.ts'

/** Больше деталей перебор не тянет быстро (2^16 = 65 536 трассировок) — генератор держится ниже */
export const MAX_ROTATABLE = 16

export function allSolutions(level: Level): (0 | 1)[][] {
  const k = rotatableIndices(level).length
  if (k > MAX_ROTATABLE) throw new Error(`Слишком много поворачиваемых деталей: ${k}`)
  const out: (0 | 1)[][] = []
  for (let mask = 0; mask < 1 << k; mask++) {
    const state = Array.from({ length: k }, (_, i) => ((mask >> i) & 1) as 0 | 1)
    if (trace(level, state).solved) out.push(state)
  }
  return out
}

const distance = (a: readonly (0 | 1)[], b: readonly (0 | 1)[]) => a.reduce<number>((n, v, i) => n + (v === b[i] ? 0 : 1), 0)

export interface Analysis {
  solutions: (0 | 1)[][]
  /** Минимум касаний от состояния */
  moves: number
  /** Ближайшее решение */
  nearest: (0 | 1)[] | null
}

export function analyze(level: Level, state: readonly (0 | 1)[] = initialState(level), solutions = allSolutions(level)): Analysis {
  let best: (0 | 1)[] | null = null
  let moves = Infinity
  for (const s of solutions) {
    const d = distance(state, s)
    if (d < moves) {
      moves = d
      best = s
    }
  }
  return { solutions, moves, nearest: best }
}

/**
 * Подсказка: какую деталь повернуть следующей (индекс в pieces) — первая отличающаяся от ближайшего решения.
 * null — уже решено или решений нет.
 */
export function hint(level: Level, state: readonly (0 | 1)[], solutions = allSolutions(level)): number | null {
  const { nearest } = analyze(level, state, solutions)
  if (!nearest) return null
  const k = nearest.findIndex((v, i) => v !== state[i])
  return k < 0 ? null : rotatableIndices(level)[k]
}

/** Звёзды за уровень: 3 — за минимум ходов, 2 — до двух лишних, 1 — за решение */
export const starsFor = (moves: number, optimal: number) => (moves <= optimal ? 3 : moves <= optimal + 2 ? 2 : 1)
