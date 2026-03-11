import { isMuted } from '@/app/lib/mute';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  startTime = 0,
  volume = 0.2,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ac.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + startTime);
  osc.stop(ac.currentTime + startTime + duration);
}

/** Satisfying thud when mole is whacked */
export function playWhack() {
  if (isMuted()) return;
  tone(180, 0.08, 'square', 0, 0.3);
  tone(120, 0.12, 'square', 0.05, 0.2);
}

/** Bright bell "bonus!" when golden mole is whacked */
export function playGoldenWhack() {
  if (isMuted()) return;
  // B major bell trio — triangle waves for a chime quality
  tone(988,  0.10, 'triangle', 0,    0.30);  // B5
  tone(1245, 0.10, 'triangle', 0.08, 0.30);  // Eb6
  tone(1480, 0.22, 'triangle', 0.16, 0.32);  // F#6 sustained
  tone(1976, 0.14, 'triangle', 0.20, 0.15);  // B6 shimmer
}

/** Ascending fanfare on game end */
export function playEnd() {
  if (isMuted()) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => tone(freq, 0.2, 'sine', i * 0.1));
}
