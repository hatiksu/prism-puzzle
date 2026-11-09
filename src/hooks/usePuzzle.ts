import { useCallback, useMemo, useState } from 'react'
import { allSolutions, hint as findHint } from '../game/solver.ts'
import { initialState, rotatableIndices, trace } from '../game/trace.ts'
import type { Level } from '../game/types.ts'

/** Состояние одного уровня: ориентации деталей, ходы, история для отмены, подсказка */
export function usePuzzle(level: Level) {
  const rotatable = useMemo(() => rotatableIndices(level), [level])
  const [state, setState] = useState<(0 | 1)[]>(() => initialState(level))
  const [history, setHistory] = useState<(0 | 1)[][]>([])
  const [moves, setMoves] = useState(0)
  /** Сколько раз повёрнута каждая деталь — чтобы анимация крутилась в одну сторону, а не дёргалась назад */
  const [spins, setSpins] = useState<number[]>(() => rotatable.map(() => 0))
  const [hintPiece, setHintPiece] = useState<number | null>(null)

  const result = useMemo(() => trace(level, state), [level, state])
  // Все решения считаем один раз на уровень — для подсказок
  const solutions = useMemo(() => allSolutions(level), [level])

  const rotate = useCallback(
    (pieceIndex: number) => {
      const k = rotatable.indexOf(pieceIndex)
      if (k < 0 || result.solved) return false
      setHistory((h) => [...h, state])
      setState((s) => s.map((v, i) => (i === k ? ((1 - v) as 0 | 1) : v)))
      setSpins((s) => s.map((v, i) => (i === k ? v + 1 : v)))
      setMoves((m) => m + 1)
      setHintPiece(null)
      return true
    },
    [rotatable, result.solved, state],
  )

  const undo = useCallback(() => {
    if (!history.length || result.solved) return false
    const prev = history[history.length - 1]
    const changed = prev.findIndex((v, i) => v !== state[i])
    setHistory((h) => h.slice(0, -1))
    setState(prev)
    if (changed >= 0) setSpins((s) => s.map((v, i) => (i === changed ? v - 1 : v)))
    setMoves((m) => m + 1)
    setHintPiece(null)
    return true
  }, [history, result.solved, state])

  const restart = useCallback(() => {
    setState(initialState(level))
    setHistory([])
    setMoves(0)
    setSpins(rotatable.map(() => 0))
    setHintPiece(null)
  }, [level, rotatable])

  const showHint = useCallback(() => {
    setHintPiece(findHint(level, state, solutions))
  }, [level, state, solutions])

  return {
    state,
    result,
    moves,
    spins,
    rotatable,
    hintPiece,
    canUndo: history.length > 0 && !result.solved,
    rotate,
    undo,
    restart,
    showHint,
  }
}
