// Прогресс (звёзды по уровням) и настройки в localStorage. Если хранилище недоступно — играем без сохранения.

const PROGRESS_KEY = 'prism:progress'
const SOUND_KEY = 'prism:sound'

export type Progress = Record<number, 1 | 2 | 3>

export function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') as Record<string, unknown>
    const out: Progress = {}
    for (const [k, v] of Object.entries(raw)) if (v === 1 || v === 2 || v === 3) out[Number(k)] = v
    return out
  } catch {
    return {}
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    // нет доступа — не страшно
  }
}

export function loadSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    // нет доступа — не страшно
  }
}
