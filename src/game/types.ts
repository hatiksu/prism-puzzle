// Типы головоломки. Уровень и состояние — обычные данные: их легко сохранить, сравнить и проверить в тестах.

/** Направление луча: 0 — вверх, 1 — вправо, 2 — вниз, 3 — влево (ось Y направлена вниз) */
export type Dir = 0 | 1 | 2 | 3

/** Цвет как набор битов RGB: 1 — красный, 2 — зелёный, 4 — синий. Смешение — побитовое ИЛИ. */
export type ColorMask = number

export const RED = 1
export const GREEN = 2
export const BLUE = 4
export const WHITE = RED | GREEN | BLUE

export type Piece =
  /** Источник луча */
  | { t: 'E'; x: number; y: number; d: Dir; c: ColorMask }
  /** Кристалл-цель: луч проходит сквозь него и подсвечивает. Нужен ровно цвет c */
  | { t: 'T'; x: number; y: number; c: ColorMask }
  /** Зеркало: r = 0 — «/», r = 1 — «\». f — закреплено (нельзя повернуть) */
  | { t: 'M'; x: number; y: number; r: 0 | 1; f?: boolean }
  /** Светоделитель: луч идёт дальше И отражается, как от зеркала той же ориентации */
  | { t: 'S'; x: number; y: number; r: 0 | 1; f?: boolean }
  /** Стена — луч останавливается */
  | { t: 'W'; x: number; y: number }

export interface Level {
  id: number
  w: number
  h: number
  pieces: Piece[]
  /** Минимум касаний до решения из начальной позиции (считает решатель) */
  optimal: number
  /** Ориентации поворачиваемых деталей в одном из решений (по порядку в pieces) */
  solution: (0 | 1)[]
}

/** Отрезок луча между центрами клеток (в координатах клеток, центр клетки — x + 0.5) */
export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  c: ColorMask
}

export interface TraceResult {
  segments: Segment[]
  /** Какие цвета дошли до каждой цели (по индексу детали в pieces) */
  lit: Map<number, ColorMask>
  solved: boolean
}
