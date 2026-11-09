// Уровни игры. Сгенерированы скриптом scripts/generate-levels.ts и проверены решателем в тестах.
import data from './levels.json'
import type { Level } from './types.ts'

export const LEVELS = data as Level[]

/** Главы по шесть уровней — для экрана выбора */
export const CHAPTERS = [
  { title: 'Первый луч', from: 1 },
  { title: 'Спектр', from: 7 },
  { title: 'Отражения', from: 13 },
  { title: 'Белый свет', from: 19 },
]
