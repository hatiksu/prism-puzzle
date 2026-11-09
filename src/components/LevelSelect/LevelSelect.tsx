import { motion } from 'motion/react'
import { CHAPTERS, LEVELS } from '../../game/levels.ts'
import type { Progress } from '../../lib/storage.ts'
import { Glyph, IconButton } from '../IconButton/IconButton'
import styles from './LevelSelect.module.css'

interface LevelSelectProps {
  progress: Progress
  sound: boolean
  onPlay: (id: number) => void
  onToggleSound: () => void
}

/** Экран выбора уровня: уровень открывается, когда пройден предыдущий */
export function LevelSelect({ progress, sound, onPlay, onToggleSound }: LevelSelectProps) {
  const totalStars = Object.values(progress).reduce((s, v) => s + v, 0)
  const unlocked = (id: number) => id === 1 || Boolean(progress[id - 1])

  return (
    <motion.div className={styles.screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Призма</h1>
          <p className={styles.subtitle}>Направь свет — зажги кристаллы</p>
        </div>
        <IconButton label={sound ? 'Выключить звук' : 'Включить звук'} onClick={onToggleSound}>
          <Glyph name={sound ? 'soundOn' : 'soundOff'} />
        </IconButton>
      </header>

      <p className={styles.total} aria-label={`Собрано звёзд: ${totalStars} из ${LEVELS.length * 3}`}>
        ★ {totalStars} / {LEVELS.length * 3}
      </p>

      <ul className={styles.rules}>
        <li>Касание поворачивает зеркало «/» ↔ «\»</li>
        <li>Светоделитель пропускает луч и отражает его</li>
        <li>Лучи смешиваются: красный + синий = пурпурный</li>
        <li>Каждому кристаллу нужен точно его цвет</li>
      </ul>

      {CHAPTERS.map((ch, ci) => {
        const items = LEVELS.slice(ch.from - 1, (CHAPTERS[ci + 1]?.from ?? LEVELS.length + 1) - 1)
        return (
          <section key={ch.title} className={styles.chapter}>
            <h2 className={styles.chapterTitle}>{ch.title}</h2>
            <div className={styles.grid}>
              {items.map((lv, i) => {
                const open = unlocked(lv.id)
                const stars = progress[lv.id] ?? 0
                return (
                  <motion.button
                    key={lv.id}
                    type="button"
                    className={`${styles.level} ${stars ? styles.done : ''}`}
                    disabled={!open}
                    onClick={() => onPlay(lv.id)}
                    aria-label={open ? `Уровень ${lv.id}${stars ? `, звёзд: ${stars}` : ''}` : `Уровень ${lv.id}, закрыт`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * (ci * 6 + i) }}
                    whileTap={open ? { scale: 0.93 } : undefined}
                  >
                    <span className={styles.number}>{open ? lv.id : '🔒'}</span>
                    <span className={styles.levelStars} aria-hidden="true">
                      {[1, 2, 3].map((n) => (
                        <i key={n} className={n <= stars ? styles.starOn : undefined}>
                          ★
                        </i>
                      ))}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>
        )
      })}
    </motion.div>
  )
}
