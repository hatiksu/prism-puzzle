// Детерминированный генератор случайных чисел (mulberry32): одно и то же зерно — одни и те же уровни.

export function createRng(seed: number) {
  let s = seed | 0
  const next = () => {
    s = (s + 0x6d2b79f5) | 0
    let r = Math.imul(s ^ (s >>> 15), s | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    shuffle: <T>(items: T[]): T[] => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[items[i], items[j]] = [items[j], items[i]]
      }
      return items
    },
  }
}

export type Rng = ReturnType<typeof createRng>
