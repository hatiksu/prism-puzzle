// Генерирует набор уровней и сохраняет в src/game/levels.json.
// Уровни фиксированы в репозитории: игра у всех одинаковая, а тесты проверяют каждый уровень решателем.
// Запуск: npm run levels
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateLevel, optionsFor } from '../src/game/generator.ts'
import type { Level } from '../src/game/types.ts'

const COUNT = 24
const BASE_SEED = 20261109
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'game', 'levels.json')

const levels: Level[] = []
for (let n = 1; n <= COUNT; n++) {
  let level: Level | null = null
  // Если с этим зерном не вышло — пробуем следующее
  for (let s = 0; !level && s < 50; s++) level = generateLevel(BASE_SEED + n * 1000 + s, optionsFor(n), n)
  if (!level) throw new Error(`Не удалось сгенерировать уровень ${n}`)
  levels.push(level)
  console.log(`уровень ${String(n).padStart(2)}: ${level.w}×${level.h}, деталей ${level.pieces.length}, минимум ходов ${level.optimal}`)
}

writeFileSync(OUT, JSON.stringify(levels) + '\n')
console.log(`Сохранено ${levels.length} уровней → src/game/levels.json`)
