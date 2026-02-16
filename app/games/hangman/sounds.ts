import { isMuted } from '@/app/lib/mute';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', startTime = 0) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, ac.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + startTime);
  osc.stop(ac.currentTime + startTime + duration);
}

/** Bright ding for correct letter */
export function playCorrect() {
  if (isMuted()) return;
  tone(880, 0.15, 'sine');
}

/** Low buzz for wrong letter */
export function playWrong() {
  if (isMuted()) return;
  tone(150, 0.2, 'square');
}

/** Ascending celebration on win */
export function playWin() {
  if (isMuted()) return;
  const notes = [523, 587, 659, 784, 1047]; // C5 D5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, 0.22, 'sine', i * 0.12);
  });
}

/** Descending sad notes on loss */
export function playLose() {
  if (isMuted()) return;
  const notes = [523, 466, 392, 330, 262]; // C5 Bb4 G4 E4 C4
  notes.forEach((freq, i) => {
    tone(freq, 0.25, 'triangle', i * 0.15);
  });
}
