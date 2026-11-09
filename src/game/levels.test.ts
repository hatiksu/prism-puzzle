import { describe, expect, it } from 'vitest'
import { generateLevel, optionsFor } from './generator.ts'
import { LEVELS } from './levels.ts'
import { allSolutions, analyze, hint, starsFor } from './solver.ts'
import { initialState, rotatableIndices, trace } from './trace.ts'
import type { Level } from './types.ts'

describe('решатель', () => {
  const tiny: Level = {
    id: 0,
    w: 3,
    h: 3,
    pieces: [
      { t: 'E', x: 0, y: 2, d: 1, c: 1 },
      { t: 'M', x: 1, y: 2, r: 1 },
      { t: 'T', x: 1, y: 0, c: 1 },
    ],
    optimal: 1,
    solution: [0],
  }

  it('находит единственное решение и минимум ходов', () => {
    expect(allSolutions(tiny)).toEqual([[0]])
    expect(analyze(tiny).moves).toBe(1)
  })

  it('подсказывает, какую деталь повернуть', () => {
    expect(hint(tiny, [1])).toBe(1)
    expect(hint(tiny, [0])).toBeNull()
  })

  it('звёзды', () => {
    expect(starsFor(4, 4)).toBe(3)
    expect(starsFor(6, 4)).toBe(2)
    expect(starsFor(7, 4)).toBe(1)
  })
})

describe('все уровни игры', () => {
  it('24 уровня с номерами по порядку', () => {
    expect(LEVELS).toHaveLength(24)
    LEVELS.forEach((lv, i) => expect(lv.id).toBe(i + 1))
  })

  it.each(LEVELS.map((lv) => [lv.id, lv] as const))('уровень %i: корректен, решаем, минимум ходов верный', (_, lv) => {
    // Детали внутри поля и не накладываются
    const cells = new Set<string>()
    for (const p of lv.pieces) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThan(lv.w)
      expect(p.y).toBeLessThan(lv.h)
      const k = `${p.x},${p.y}`
      expect(cells.has(k), `две детали в клетке ${k}`).toBe(false)
      cells.add(k)
    }
    expect(lv.pieces.some((p) => p.t === 'T')).toBe(true)

    // Сохранённое решение действительно решает уровень
    expect(lv.solution).toHaveLength(rotatableIndices(lv).length)
    expect(trace(lv, lv.solution).solved).toBe(true)

    // Начальная позиция не решена, а минимум ходов совпадает с решателем
    const start = initialState(lv)
    expect(trace(lv, start).solved).toBe(false)
    const { moves, solutions } = analyze(lv, start)
    expect(moves).toBe(lv.optimal)
    expect(solutions.length).toBeGreaterThan(0)
  })

  it('сложность растёт: последние уровни требуют больше ходов, чем первые', () => {
    const avg = (xs: Level[]) => xs.reduce((s, l) => s + l.optimal, 0) / xs.length
    expect(avg(LEVELS.slice(-6))).toBeGreaterThan(avg(LEVELS.slice(0, 6)) + 2)
  })
})

describe('генератор', () => {
  it('детерминирован: одно зерно — один и тот же уровень', () => {
    const o = optionsFor(1)
    expect(generateLevel(7, o, 1)).toEqual(generateLevel(7, o, 1))
  })

  it('строит решаемый уровень с заданной сложностью', () => {
    const lv = generateLevel(123, optionsFor(4), 4)!
    expect(lv).not.toBeNull()
    expect(lv.optimal).toBeGreaterThanOrEqual(optionsFor(4).minMoves)
    expect(trace(lv, lv.solution).solved).toBe(true)
  })
})
