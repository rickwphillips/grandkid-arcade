import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameCard } from '@/app/components/GameCard';
import type { GameDefinition } from '@/app/lib/gameRegistry';

const testGame: GameDefinition = {
  slug: 'connect-4',
  title: 'Connect 4',
  description: 'Drop pieces to connect four in a row!',
  emoji: '🔴',
  ageRange: [4, 18],
  category: 'puzzle',
};

describe('GameCard', () => {
  it('renders game emoji', () => {
    render(<GameCard game={testGame} />);
    expect(screen.getByText('🔴')).toBeInTheDocument();
  });

  it('renders game title', () => {
    render(<GameCard game={testGame} />);
    expect(screen.getByText('Connect 4')).toBeInTheDocument();
  });

  it('renders age range text', () => {
    render(<GameCard game={testGame} />);
    expect(screen.getByText('Ages 4+')).toBeInTheDocument();
  });

  it('renders category chip with correct label', () => {
    render(<GameCard game={testGame} />);
    expect(screen.getByText('puzzle')).toBeInTheDocument();
  });

  it('link href points to /games/<slug>', () => {
    render(<GameCard game={testGame} />);
    const link = screen.getByRole('link');
    // Next.js Link normalizes trailing slashes in jsdom
    expect(link.getAttribute('href')).toMatch(/\/games\/connect-4\/?$/);
  });

  it('renders description text', () => {
    render(<GameCard game={testGame} />);
    expect(screen.getByText('Drop pieces to connect four in a row!')).toBeInTheDocument();
  });
});
