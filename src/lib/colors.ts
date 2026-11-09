// Цвета лучей: маска RGB → цвет на экране и название для экранных дикторов.
import type { ColorMask } from '../game/types.ts'

const HEX: Record<number, string> = {
  1: '#ff4d6d',
  2: '#3ddc84',
  3: '#ffd23f',
  4: '#4d8dff',
  5: '#e34dff',
  6: '#2ee6e6',
  7: '#ffffff',
}

const NAMES: Record<number, string> = {
  1: 'красный',
  2: 'зелёный',
  3: 'жёлтый',
  4: 'синий',
  5: 'пурпурный',
  6: 'голубой',
  7: 'белый',
}

export const colorHex = (c: ColorMask) => HEX[c] ?? '#666'
export const colorName = (c: ColorMask) => NAMES[c] ?? 'без света'
