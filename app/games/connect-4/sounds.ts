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

/** Low thud when a piece drops */
export function playDrop() {
  if (isMuted()) return;
  tone(200, 0.12, 'triangle');
}

/** Ascending 5-note celebration on win */
export function playWin() {
  if (isMuted()) return;
  const notes = [523, 587, 659, 784, 1047]; // C5 D5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, 0.22, 'sine', i * 0.12);
  });
}

/** Quick buzz for invalid move (full column) */
export function playInvalid() {
  if (isMuted()) return;
  tone(150, 0.1, 'square');
}
