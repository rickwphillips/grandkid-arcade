export const MAX_WRONG = 6;

export function guessLetter(guessed: Set<string>, letter: string): Set<string> {
  const next = new Set(guessed);
  next.add(letter.toUpperCase());
  return next;
}

export function getWrongCount(word: string, guessed: Set<string>): number {
  const wordLetters = new Set(word.toUpperCase().replace(/[^A-Z]/g, '').split(''));
  let count = 0;
  for (const letter of guessed) {
    if (!wordLetters.has(letter)) count++;
  }
  return count;
}

export function isWon(word: string, guessed: Set<string>): boolean {
  const letters = word.toUpperCase().split('').filter((ch) => /[A-Z]/.test(ch));
  return letters.every((ch) => guessed.has(ch));
}

export function isLost(wrongCount: number): boolean {
  return wrongCount >= MAX_WRONG;
}

export function getMaskedWord(word: string, guessed: Set<string>): string {
  return word
    .toUpperCase()
    .split('')
    .map((ch) => {
      if (/[A-Z]/.test(ch)) return guessed.has(ch) ? ch : '_';
      return ch; // spaces, punctuation shown as-is
    })
    .join('');
}

export function calcScore(wrongCount: number, wordLength: number): number {
  // Base: 100 points per letter, minus 15 per wrong guess
  const base = wordLength * 100;
  const penalty = wrongCount * 15;
  return Math.max(10, base - penalty);
}
