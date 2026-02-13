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

/** Short pop/click when a card is tapped */
export function playFlip() {
  tone(600, 0.1, 'triangle');
}

/** Happy ascending two-note chime on match */
export function playMatch() {
  tone(523, 0.15, 'sine');        // C5
  tone(784, 0.25, 'sine', 0.12); // G5
}

/** Gentle descending boop on mismatch */
export function playMismatch() {
  tone(400, 0.15, 'sine');
  tone(300, 0.2, 'sine', 0.12);
}

/** Celebratory ascending scale on win */
export function playWin() {
  const notes = [523, 587, 659, 784, 1047]; // C5 D5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, 0.22, 'sine', i * 0.12);
  });
}
