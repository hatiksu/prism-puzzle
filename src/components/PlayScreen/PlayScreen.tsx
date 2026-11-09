import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { starsFor } from '../../game/solver.ts'
import type { Level } from '../../game/types.ts'
import { usePuzzle } from '../../hooks/usePuzzle.ts'
import { sounds, unlockSound } from '../../lib/sound.ts'
import { Board } from '../Board/Board'
import { TopBar } from '../TopBar/TopBar'
import { WinDialog } from '../WinDialog/WinDialog'
import styles from './PlayScreen.module.css'

interface PlayScreenProps {
  level: Level
  hasNext: boolean
  sound: boolean
  onSolved: (stars: 1 | 2 | 3) => void
  onNext: () => void
  onReplay: () => void
  onBack: () => void
  onToggleSound: () => void
}

export function PlayScreen({ level, hasNext, sound, onSolved, onNext, onReplay, onBack, onToggleSound }: PlayScreenProps) {
  const puzzle = usePuzzle(level)
  const { result, moves } = puzzle
  const targets = level.pieces.filter((p) => p.t === 'T')
  const litCount = level.pieces.reduce((n, p, i) => n + (p.t === 'T' && result.lit.get(i) === p.c ? 1 : 0), 0)
  const stars = starsFor(moves, level.optimal) as 1 | 2 | 3

  // Звук, когда загорается очередной кристалл, и победа
  const prevLit = useRef(litCount)
  useEffect(() => {
    if (litCount > prevLit.current && !result.solved) sounds.lit(litCount)
    prevLit.current = litCount
  }, [litCount, result.solved])

  const reported = useRef(false)
  useEffect(() => {
    if (result.solved && !reported.current) {
      reported.current = true
      sounds.win()
      navigator.vibrate?.([20, 40, 20])
      onSolved(stars)
    }
  }, [result.solved, stars, onSolved])

  const rotate = (i: number) => {
    unlockSound()
    if (puzzle.rotate(i)) {
      sounds.rotate()
      navigator.vibrate?.(6)
    }
  }

  return (
    <motion.div className={styles.screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <TopBar
        levelId={level.id}
        moves={moves}
        optimal={level.optimal}
        litCount={litCount}
        targetCount={targets.length}
        canUndo={puzzle.canUndo}
        sound={sound}
        onBack={onBack}
        onUndo={() => puzzle.undo() && sounds.undo()}
        onRestart={puzzle.restart}
        onHint={puzzle.showHint}
        onToggleSound={onToggleSound}
      />
      <div className={styles.boardWrap}>
        <Board
          level={level}
          result={result}
          state={puzzle.state}
          rotatable={puzzle.rotatable}
          spins={puzzle.spins}
          hintPiece={puzzle.hintPiece}
          onRotate={rotate}
        />
      </div>
      <p className={styles.tip}>Касайтесь зеркал, чтобы поворачивать их</p>

      <AnimatePresence>
        {result.solved && (
          <WinDialog stars={stars} moves={moves} optimal={level.optimal} hasNext={hasNext} onNext={onNext} onReplay={onReplay} onLevels={onBack} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
