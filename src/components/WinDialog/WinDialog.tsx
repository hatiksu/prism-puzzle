import { motion } from 'motion/react'
import styles from './WinDialog.module.css'

interface WinDialogProps {
  stars: 1 | 2 | 3
  moves: number
  optimal: number
  hasNext: boolean
  onNext: () => void
  onReplay: () => void
  onLevels: () => void
}

export function WinDialog({ stars, moves, optimal, hasNext, onNext, onReplay, onLevels }: WinDialogProps) {
  return (
    <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.35 }}>
      <motion.div
        className={styles.card}
        role="dialog"
        aria-label="Уровень пройден"
        initial={{ y: 30, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <h2 className={styles.title}>Свет найден!</h2>
        <div className={styles.stars} aria-label={`Звёзд: ${stars} из 3`} data-testid="stars" data-stars={stars}>
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              className={n <= stars ? styles.on : styles.off}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5 + n * 0.15, type: 'spring', stiffness: 400, damping: 12 }}
            >
              ★
            </motion.span>
          ))}
        </div>
        <p className={styles.text}>
          {moves <= optimal ? `Идеально: ${moves} ${plural(moves)} — минимум!` : `${moves} ${plural(moves)}, минимум — ${optimal}`}
        </p>
        <div className={styles.actions}>
          {hasNext && (
            <button type="button" className={styles.primary} onClick={onNext} autoFocus>
              Следующий уровень
            </button>
          )}
          <button type="button" className={hasNext ? styles.secondary : styles.primary} onClick={onReplay}>
            Ещё раз
          </button>
          <button type="button" className={styles.secondary} onClick={onLevels}>
            К уровням
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function plural(n: number) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'ход'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'хода'
  return 'ходов'
}
