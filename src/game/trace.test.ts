import { describe, expect, it } from 'vitest'
import { reflect, rotatableIndices, trace } from './trace.ts'
import { BLUE, GREEN, RED, type Level, type Piece } from './types.ts'

const level = (w: number, h: number, pieces: Piece[]): Level => ({ id: 0, w, h, pieces, optimal: 0, solution: [] })
const state = (lv: Level) => rotatableIndices(lv).map((i) => (lv.pieces[i] as { r: 0 | 1 }).r)

describe('отражение', () => {
  it('«/»: вправо → вверх, вверх → вправо, влево → вниз, вниз → влево', () => {
    expect([reflect(1, 0), reflect(0, 0), reflect(3, 0), reflect(2, 0)]).toEqual([0, 1, 2, 3])
  })
  it('«\\»: вправо → вниз, вниз → вправо, влево → вверх, вверх → влево', () => {
    expect([reflect(1, 1), reflect(2, 1), reflect(3, 1), reflect(0, 1)]).toEqual([2, 1, 0, 3])
  })
})

describe('трассировка', () => {
  it('луч доходит до цели через зеркало', () => {
    // Источник слева светит вправо, зеркало «/» поворачивает вверх, цель сверху
    const lv = level(3, 3, [
      { t: 'E', x: 0, y: 2, d: 1, c: RED },
      { t: 'M', x: 1, y: 2, r: 0 },
      { t: 'T', x: 1, y: 0, c: RED },
    ])
    expect(trace(lv, [0]).solved).toBe(true)
    // Другая ориентация уводит луч вниз — цель не горит
    const miss = trace(lv, [1])
    expect(miss.solved).toBe(false)
    expect(miss.lit.get(2)).toBe(0)
  })

  it('светоделитель пускает луч дальше и отражает', () => {
    const lv = level(3, 3, [
      { t: 'E', x: 0, y: 1, d: 1, c: GREEN },
      { t: 'S', x: 1, y: 1, r: 0 },
      { t: 'T', x: 2, y: 1, c: GREEN },
      { t: 'T', x: 1, y: 0, c: GREEN },
    ])
    const r = trace(lv, [0])
    expect(r.lit.get(2)).toBe(GREEN)
    expect(r.lit.get(3)).toBe(GREEN)
    expect(r.solved).toBe(true)
  })

  it('цвета смешиваются на цели, нужен точный цвет', () => {
    const pieces: Piece[] = [
      { t: 'E', x: 0, y: 1, d: 1, c: RED },
      { t: 'E', x: 1, y: 2, d: 0, c: BLUE },
      { t: 'T', x: 1, y: 1, c: RED | BLUE },
    ]
    const r = trace(level(3, 3, pieces), [])
    expect(r.lit.get(2)).toBe(RED | BLUE)
    expect(r.solved).toBe(true)

    const onlyRed = trace(level(3, 3, [pieces[0], { t: 'T', x: 1, y: 1, c: RED | BLUE }]), [])
    expect(onlyRed.solved).toBe(false)
    // Лишний цвет — тоже не решение
    const tooMuch = trace(level(3, 3, [...pieces.slice(0, 2), { t: 'T', x: 1, y: 1, c: RED }]), [])
    expect(tooMuch.solved).toBe(false)
  })

  it('стена и другой источник останавливают луч', () => {
    const wall = trace(level(4, 1, [{ t: 'E', x: 0, y: 0, d: 1, c: RED }, { t: 'W', x: 1, y: 0 }, { t: 'T', x: 2, y: 0, c: RED }]), [])
    expect(wall.lit.get(2)).toBe(0)
    const emitter = trace(level(4, 1, [{ t: 'E', x: 0, y: 0, d: 1, c: RED }, { t: 'E', x: 1, y: 0, d: 3, c: BLUE }, { t: 'T', x: 3, y: 0, c: RED }]), [])
    expect(emitter.lit.get(2)).toBe(0)
  })

  it('закреплённые детали не входят в состояние и всё равно отражают', () => {
    const lv = level(3, 3, [
      { t: 'E', x: 0, y: 2, d: 1, c: RED },
      { t: 'M', x: 1, y: 2, r: 0, f: true },
      { t: 'T', x: 1, y: 0, c: RED },
    ])
    expect(rotatableIndices(lv)).toEqual([])
    expect(trace(lv, []).solved).toBe(true)
  })

  it('зацикленные лучи не вешают трассировку', () => {
    // Четыре делителя по углам квадрата гоняют луч по кругу
    const lv = level(4, 4, [
      { t: 'E', x: 0, y: 1, d: 1, c: RED },
      { t: 'S', x: 1, y: 1, r: 1 },
      { t: 'S', x: 1, y: 2, r: 0 },
      { t: 'S', x: 2, y: 2, r: 1 },
      { t: 'S', x: 2, y: 1, r: 0 },
      { t: 'T', x: 3, y: 3, c: RED },
    ])
    const r = trace(lv, state(lv))
    expect(r.segments.length).toBeLessThan(200)
  })

  it('без целей уровень не считается решённым', () => {
    expect(trace(level(3, 1, [{ t: 'E', x: 0, y: 0, d: 1, c: RED }]), []).solved).toBe(false)
  })
})
