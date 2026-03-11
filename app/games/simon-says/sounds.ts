import { isMuted } from '@/app/lib/mute';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine') {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

// Classic Simon tones: Red, Green, Blue, Yellow
const COLOR_FREQS = [310, 415, 209, 252];

/** Play the tone for a given color index (0=Red, 1=Green, 2=Blue, 3=Yellow) */
export function playColor(idx: number) {
  if (isMuted()) return;
  tone(COLOR_FREQS[idx], 0.35, 'sine');
}

/** Descending fail sound on wrong press */
export function playLose() {
  if (isMuted()) return;
  const notes = [523, 466, 392, 330, 262];
  const ac = getCtx();
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = ac.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}
