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

/** Pleasant two-note chime when a word is found */
export function playFound() {
  if (isMuted()) return;
  tone(784, 0.1, 'sine', 0);     // G5
  tone(1047, 0.18, 'sine', 0.1); // C6
}

/** Ascending fanfare when all words are found */
export function playWin() {
  if (isMuted()) return;
  const notes = [523, 587, 659, 784, 1047]; // C5 D5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, 0.22, 'sine', i * 0.12);
  });
}
