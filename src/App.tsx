import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { LevelSelect } from './components/LevelSelect/LevelSelect'
import { PlayScreen } from './components/PlayScreen/PlayScreen'
import { LEVELS } from './game/levels.ts'
import { setSoundEnabled, unlockSound } from './lib/sound.ts'
import { loadProgress, loadSound, saveProgress, saveSound, type Progress } from './lib/storage.ts'
import styles from './App.module.css'

/** Уровень хранится в адресе (#7), чтобы работала кнопка «Назад» и ссылка на уровень */
const levelFromHash = (): number | null => {
  const n = Number(location.hash.slice(1))
  return Number.isInteger(n) && n >= 1 && n <= LEVELS.length ? n : null
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [sound, setSound] = useState(loadSound)
  const [current, setCurrent] = useState<number | null>(levelFromHash)
  // Ключ попытки: меняется при «Ещё раз», чтобы уровень начался с чистого листа
  const [attempt, setAttempt] = useState(0)
  useRegisterSW({ immediate: true })

  useEffect(() => setSoundEnabled(sound), [sound])

  useEffect(() => {
    const onHash = () => setCurrent(levelFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const unlocked = (id: number) => id === 1 || Boolean(progress[id - 1])

  const open = (id: number | null) => {
    unlockSound()
    location.hash = id ? String(id) : ''
    setCurrent(id)
    setAttempt((a) => a + 1)
  }

  const onSolved = useCallback(
    (stars: 1 | 2 | 3) => {
      if (current === null) return
      setProgress((p) => {
        const next = { ...p, [current]: Math.max(p[current] ?? 0, stars) as 1 | 2 | 3 }
        saveProgress(next)
        return next
      })
    },
    [current],
  )

  const toggleSound = () => {
    setSound((s) => {
      saveSound(!s)
      return !s
    })
  }

  // Открыть по ссылке можно только доступный уровень
  const level = current !== null && unlocked(current) ? LEVELS[current - 1] : null

  return (
    <MotionConfig reducedMotion="user">
      <main className={styles.app}>
        <AnimatePresence mode="wait">
          {level ? (
            <PlayScreen
              key={`${level.id}:${attempt}`}
              level={level}
              hasNext={level.id < LEVELS.length}
              sound={sound}
              onSolved={onSolved}
              onNext={() => open(level.id + 1)}
              onReplay={() => open(level.id)}
              onBack={() => open(null)}
              onToggleSound={toggleSound}
            />
          ) : (
            <LevelSelect key="levels" progress={progress} sound={sound} onPlay={open} onToggleSound={toggleSound} />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  )
}
