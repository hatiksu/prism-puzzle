import type { ReactNode } from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

export function IconButton({ label, onClick, disabled, children }: IconButtonProps) {
  return (
    <button type="button" className={styles.button} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

const paths = {
  back: 'M15 18l-6-6 6-6',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  restart: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5',
  hint: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
  soundOn: 'M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  soundOff: 'M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6',
} as const

export function Glyph({ name }: { name: keyof typeof paths }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
