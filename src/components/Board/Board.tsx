import { motion } from 'motion/react'
import type { Level, Piece, TraceResult } from '../../game/types.ts'
import { colorHex, colorName } from '../../lib/colors.ts'
import styles from './Board.module.css'

interface BoardProps {
  level: Level
  result: TraceResult
  /** Ориентации поворачиваемых деталей (по порядку rotatable) */
  state: (0 | 1)[]
  rotatable: number[]
  spins: number[]
  hintPiece: number | null
  onRotate: (pieceIndex: number) => void
}

const DIR_ANGLE = [-90, 0, 90, 180]
const pieceName: Record<Piece['t'], string> = { E: 'Источник', T: 'Кристалл', M: 'Зеркало', S: 'Светоделитель', W: 'Стена' }

/**
 * Поле на SVG: 1 единица = 1 клетка. Лучи рисуются дважды — широкий размытый слой и тонкая яркая линия,
 * а режим смешения screen даёт настоящие смешанные цвета там, где лучи пересекаются.
 */
export function Board({ level, result, state, rotatable, spins, hintPiece, onRotate }: BoardProps) {
  const { w, h, pieces } = level
  const pad = 0.15

  return (
    <svg
      className={styles.board}
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      role="group"
      aria-label={`Поле ${w} на ${h}`}
      style={{ aspectRatio: `${w + pad * 2} / ${h + pad * 2}` }}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.09" />
        </filter>
        <radialGradient id="cellShade" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#1b1838" />
          <stop offset="1" stopColor="#121028" />
        </radialGradient>
      </defs>

      {/* Клетки */}
      {Array.from({ length: w * h }, (_, i) => (
        <rect key={i} x={(i % w) + 0.04} y={Math.floor(i / w) + 0.04} width={0.92} height={0.92} rx={0.14} fill="url(#cellShade)" />
      ))}

      {/* Лучи */}
      <g className={styles.beams}>
        <g filter="url(#glow)" opacity={0.9}>
          {result.segments.map((s, i) => (
            <line key={`g${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={colorHex(s.c)} strokeWidth={0.22} strokeLinecap="round" />
          ))}
        </g>
        {result.segments.map((s, i) => (
          <line key={`l${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={colorHex(s.c)} strokeWidth={0.06} strokeLinecap="round" />
        ))}
      </g>

      {/* Детали */}
      {pieces.map((p, i) => {
        const k = rotatable.indexOf(i)
        const cx = p.x + 0.5
        const cy = p.y + 0.5

        if (p.t === 'W') {
          return <rect key={i} x={p.x + 0.08} y={p.y + 0.08} width={0.84} height={0.84} rx={0.12} className={styles.wall} />
        }

        if (p.t === 'E') {
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${DIR_ANGLE[p.d]})`} aria-label={`${pieceName.E}, ${colorName(p.c)} луч`} role="img">
              <rect x={-0.36} y={-0.36} width={0.72} height={0.72} rx={0.18} className={styles.emitter} />
              <circle r={0.17} fill={colorHex(p.c)} />
              <circle r={0.3} fill={colorHex(p.c)} opacity={0.25} filter="url(#glow)" />
              <path d="M0.3 -0.12 L0.45 0 L0.3 0.12 Z" fill={colorHex(p.c)} />
            </g>
          )
        }

        if (p.t === 'T') {
          const got = result.lit.get(i) ?? 0
          const done = got === p.c
          return (
            <g key={i} transform={`translate(${cx} ${cy})`} role="img" aria-label={`${pieceName.T}: нужен ${colorName(p.c)}, сейчас ${colorName(got)}${done ? ', горит' : ''}`}>
              {done && <circle r={0.42} fill={colorHex(p.c)} opacity={0.35} filter="url(#glow)" className={styles.pulse} />}
              <motion.path
                d="M0 -0.34 L0.28 0 L0 0.34 L-0.28 0 Z"
                fill={done ? colorHex(p.c) : got ? colorHex(got) : '#0b0a1a'}
                fillOpacity={done ? 1 : got ? 0.35 : 1}
                stroke={colorHex(p.c)}
                strokeWidth={0.06}
                strokeLinejoin="round"
                animate={{ scale: done ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              />
              <path d="M-0.14 -0.08 L0 -0.22 L0.06 -0.12" stroke="#fff" strokeOpacity={0.6} strokeWidth={0.03} fill="none" />
            </g>
          )
        }

        // Зеркало или светоделитель
        const fixed = k < 0
        const r = fixed ? p.r : state[k]
        // Базовая ориентация «/» = 0°, «\» = 90°. Для поворачиваемых — накапливаем обороты, чтобы крутилось плавно в одну сторону
        const angle = fixed ? r * 90 : initialAngle(level, i) + spins[k] * 90
        const isHint = hintPiece === i
        const label = `${pieceName[p.t]} «${r === 0 ? '/' : '\\'}», строка ${p.y + 1}, столбец ${p.x + 1}${fixed ? ', закреплено' : ''}`

        return (
          <g
            key={i}
            className={fixed ? undefined : styles.rotatable}
            role={fixed ? 'img' : 'button'}
            tabIndex={fixed ? undefined : 0}
            aria-label={label}
            data-hint={isHint || undefined}
            onClick={fixed ? undefined : () => onRotate(i)}
            onKeyDown={
              fixed
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRotate(i)
                    }
                  }
            }
          >
            <rect x={p.x + 0.04} y={p.y + 0.04} width={0.92} height={0.92} rx={0.14} fill="transparent" className={styles.hit} />
            {isHint && <rect x={p.x + 0.06} y={p.y + 0.06} width={0.88} height={0.88} rx={0.14} className={styles.hint} />}
            <motion.g
              initial={false}
              animate={{ rotate: angle }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              {p.t === 'M' ? (
                <>
                  <line x1={cx - 0.32} y1={cy + 0.32} x2={cx + 0.32} y2={cy - 0.32} className={styles.mirrorBack} />
                  <line x1={cx - 0.32} y1={cy + 0.32} x2={cx + 0.32} y2={cy - 0.32} className={styles.mirror} />
                </>
              ) : (
                <>
                  <line x1={cx - 0.32} y1={cy + 0.32} x2={cx + 0.32} y2={cy - 0.32} className={styles.splitterBack} />
                  <line x1={cx - 0.32} y1={cy + 0.32} x2={cx + 0.32} y2={cy - 0.32} className={styles.splitter} />
                </>
              )}
            </motion.g>
            {fixed && <circle cx={p.x + 0.82} cy={p.y + 0.18} r={0.06} className={styles.lock} />}
          </g>
        )
      })}
    </svg>
  )
}

/** Начальный угол детали: «/» — 0°, «\» — 90° */
function initialAngle(level: Level, index: number): number {
  return (level.pieces[index] as { r: 0 | 1 }).r * 90
}
