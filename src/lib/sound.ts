// Звуки синтезируются Web Audio прямо в браузере — без файлов.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

/** Звук можно включить только после действия пользователя — вызываем из обработчиков нажатий */
export function unlockSound() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.3
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, duration: number, type: OscillatorType, volume: number, delay = 0) {
  if (!enabled || !ctx || !master) return
  const t = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export const sounds = {
  rotate: () => tone(620, 0.06, 'triangle', 0.35),
  /** Кристалл засветился нужным цветом — чем больше горит, тем выше нота */
  lit: (count: number) => tone(523 * Math.pow(2, Math.min(count, 8) / 12), 0.25, 'sine', 0.45),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, 'sine', 0.4, i * 0.09)),
  undo: () => tone(380, 0.06, 'triangle', 0.25),
}
