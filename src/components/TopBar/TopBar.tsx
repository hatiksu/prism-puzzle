import { Glyph, IconButton } from '../IconButton/IconButton'
import styles from './TopBar.module.css'

interface TopBarProps {
  levelId: number
  moves: number
  optimal: number
  litCount: number
  targetCount: number
  canUndo: boolean
  sound: boolean
  onBack: () => void
  onUndo: () => void
  onRestart: () => void
  onHint: () => void
  onToggleSound: () => void
}

export function TopBar(p: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        <IconButton label="К уровням" onClick={p.onBack}>
          <Glyph name="back" />
        </IconButton>
        <div className={styles.title}>
          <h1>Уровень {p.levelId}</h1>
          <p className={styles.meta} aria-live="polite">
            Ходы <b data-testid="moves">{p.moves}</b> · минимум {p.optimal} · кристаллы {p.litCount}/{p.targetCount}
          </p>
        </div>
        <IconButton label={p.sound ? 'Выключить звук' : 'Включить звук'} onClick={p.onToggleSound}>
          <Glyph name={p.sound ? 'soundOn' : 'soundOff'} />
        </IconButton>
      </div>
      <div className={styles.tools}>
        <IconButton label="Отменить ход" onClick={p.onUndo} disabled={!p.canUndo}>
          <Glyph name="undo" />
        </IconButton>
        <IconButton label="Подсказка" onClick={p.onHint}>
          <Glyph name="hint" />
        </IconButton>
        <IconButton label="Начать заново" onClick={p.onRestart}>
          <Glyph name="restart" />
        </IconButton>
      </div>
    </header>
  )
}
