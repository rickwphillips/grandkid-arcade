'use client';

import { Box, Typography, Chip } from '@mui/material';
import { PageContainer } from '@/app/components/PageContainer';
import { APP_VERSION } from '@/app/lib/version';

interface Change {
  icon: string;
  text: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: Change[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.9.0',
    date: '2026-03-01',
    title: 'Admin Settings Consolidation',
    changes: [
      { icon: '🛠️', text: 'Merged Puzzle Images, Hangman Words, and Word Search admin into a single Admin Settings page with collapsible accordions — one section open at a time' },
      { icon: '🖱️', text: 'Puzzle Images list now shows a hover preview — lazy-loads the image after 500ms and appears at the cursor position' },
      { icon: '🔗', text: 'Home page admin nav simplified to a single Admin chip (admin-only)' },
    ],
  },
  {
    version: '1.8.4',
    date: '2026-02-26',
    title: 'Game Engine Documentation',
    changes: [
      { icon: '📐', text: 'Added PlantUML component and sequence diagrams for all 5 game engines (Connect-4, Hangman, Slide Puzzle, Color Match, Word Search)' },
      { icon: '📖', text: 'Added per-game engine reference docs covering state machines, data structures, algorithms, and scoring rules' },
    ],
  },
  {
    version: '1.8.3',
    date: '2026-02-24',
    title: 'Connect 4 Polish & UI Fixes',
    changes: [
      { icon: '⏱️', text: 'Connect 4 — win overlay, action buttons, and turn indicator all delay 1.2s so you can see the winning move before results appear' },
      { icon: '🏆', text: 'Connect 4 — turn indicator changes to "Red Wins!" / "Yellow Wins!" instead of disappearing' },
      { icon: '🔢', text: 'Connect 4 — move counter now counts rounds (one per player turn), not individual drops' },
      { icon: '🕳️', text: 'Connect 4 — removed outer glow shadow on board, added inner depth shadow on holes' },
      { icon: '✖️', text: 'Win badge close button now correctly anchors to top-right corner' },
      { icon: '📐', text: 'Win badge width constrained to the game board on all games' },
      { icon: '🎲', text: 'Slide Puzzle — initial image is now randomly selected each time' },
    ],
  },
  {
    version: '1.8.2',
    date: '2026-02-23',
    title: 'Versioned DB Migrations',
    changes: [
      { icon: '🗄️', text: 'Deploy script now applies versioned DB migrations automatically — schema changes run before PHP deploy and are tracked in schema_migrations table' },
    ],
  },
  {
    version: '1.8.1',
    date: '2026-02-22',
    title: 'Coverage Reporting',
    changes: [
      { icon: '📊', text: 'V8 coverage reporting — npm run test:coverage shows per-file line/branch/function percentages' },
      { icon: '✅', text: 'Game logic files at 93–100% line coverage; gameRegistry and GameCard at 100%' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-22',
    title: 'Test Suite',
    changes: [
      { icon: '🧪', text: 'Added Vitest test suite — 115 tests across 10 files' },
      { icon: '🎮', text: 'Unit tests for all 4 game engines: Connect 4, Hangman, Word Search, Slide Puzzle' },
      { icon: '📦', text: 'Registry, hook, API, and component tests with full mocking' },
      { icon: '⚡', text: 'npm run test:run for one-shot, npm run test for watch mode' },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-02-19',
    title: 'Settings & Auth',
    changes: [
      { icon: '⚙️', text: 'Game Settings moved to a dedicated page — all players can now adjust their settings' },
      { icon: '🔧', text: 'Settings chip added to the home screen nav bar' },
      { icon: '👤', text: 'Added "kids" user account — non-admin login for day-to-day play' },
      { icon: '🔑', text: 'Fixed logout not working when switching between apps' },
      { icon: '🆔', text: 'Auth user IDs upgraded to UUIDs' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-19',
    title: 'Word Search',
    changes: [
      { icon: '🔍', text: 'Added Word Search — find all the hidden words in the grid!' },
      { icon: '🐾', text: '6 starter themes: Animals, Colors, Family, Nature, Dinosaurs, Space' },
      { icon: '👆', text: 'Click the first and last letter of a word to select it' },
      { icon: '🟢', text: 'Easy mode: tap a word in the list to find it instantly (no score for taps)' },
      { icon: '👁️', text: 'Hard mode: word list is hidden — tap to reveal at 50% point penalty' },
      { icon: '🏆', text: '100 pts per word found on grid + 500 pt completion bonus' },
      { icon: '🔧', text: 'Admin page to create themes and manage words' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-16',
    title: 'Hangman',
    changes: [
      { icon: '🔤', text: 'Added Hangman — guess the word letter by letter!' },
      { icon: '🎈', text: 'Ella-Grace sees colorful balloons popping on wrong guesses' },
      { icon: '🚀', text: 'Mason sees a rocket falling apart on wrong guesses' },
      { icon: '🎚️', text: 'Three difficulty levels: Easy (single words), Medium (short phrases), Hard (long phrases)' },
      { icon: '🐶', text: 'Words feature family names and dog names — Copper, Penny, Lulu, Luna & Stella' },
      { icon: '⌨️', text: 'On-screen QWERTY keyboard with color-coded correct/wrong feedback' },
      { icon: '🔧', text: 'Admin page for managing hangman words and phrases' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-15',
    title: 'Game Settings',
    changes: [
      { icon: '🔇', text: 'Toggle love messages on/off per device from the admin page' },
      { icon: '🎈', text: 'Toggle floating icons (hearts, balloons) on/off per device' },
      { icon: '💾', text: 'Settings persist in browser localStorage — no login required' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-15',
    title: 'Slide Puzzle Solver',
    changes: [
      { icon: '🪄', text: 'Solve button auto-solves 3x3, 4x4, and 5x5 puzzles with animated tile moves' },
      { icon: '⏹️', text: 'Cancel solve mid-animation to resume playing manually' },
      { icon: '🏅', text: 'Win badge overlays the completed puzzle — dismiss to admire your work' },
      { icon: '👀', text: 'Hint and Solve buttons hidden by default — reveal with Show Hint' },
      { icon: '🚫', text: 'Auto-solved puzzles skip score submission' },
      { icon: '📋', text: 'Image selection changed to a dropdown list' },
      { icon: '📱', text: 'Slide Puzzle and Picture Matcher scale to fit any screen size' },
      { icon: '🧩', text: 'Shared WinBadge component — consistent win overlay across all games' },
      { icon: '🃏', text: 'Hard mode Picture Matcher uses 6-column grid to fit phone screens' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-13',
    title: 'Picture Matcher & Difficulty',
    changes: [
      { icon: '🖼️', text: 'Renamed Color Match to Picture Matcher' },
      { icon: '🎚️', text: 'Three difficulty levels: Easy (6 pairs), Medium (8 pairs), Hard (12 pairs)' },
      { icon: '🃏', text: 'Difficulty select screen before each game with New Game button' },
      { icon: '👶', text: 'Age range expanded to 3-18 for all skill levels' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-13',
    title: 'Connect 4 & Image Cards',
    changes: [
      { icon: '🔴', text: 'Added Connect 4 — play against the computer or a friend' },
      { icon: '🤖', text: 'Simple AI opponent that blocks wins and plays strategically' },
      { icon: '🎯', text: 'Realistic piece drop animation with board mask effect' },
      { icon: '🖼️', text: 'Color Match now uses uploaded puzzle images as card faces' },
      { icon: '🃏', text: 'Remaining card pairs filled with emoji fallbacks' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-13',
    title: 'Love Messages & Color Match',
    changes: [
      { icon: '💌', text: 'Added floating love messages from Grampy during gameplay' },
      { icon: '👦👧', text: 'Personalized messages for Mason and Ella-Grace' },
      { icon: '🐶', text: 'Messages from Copper, Penny, Lulu, Luna & Stella' },
      { icon: '🎈', text: 'Floating hearts and balloons during play' },
      { icon: '🃏', text: 'Added Color Match memory card game' },
      { icon: '🧩', text: 'Added Slide Puzzle with custom image uploads' },
      { icon: '👶', text: 'Grandkid selector with age-filtered games' },
      { icon: '🏆', text: 'Score tracking and favorites' },
      { icon: '🌙', text: 'Dark mode support' },
      { icon: '📋', text: 'Version number and changelog page' },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <PageContainer title="Changelog" subtitle={`Current version: v${APP_VERSION}`}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {changelog.map((entry) => (
          <Box
            key={entry.version}
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`v${entry.version}`}
                size="small"
                color={entry.version === APP_VERSION ? 'primary' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {entry.title}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                {entry.date}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {entry.changes.map((change, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Box sx={{ fontSize: '0.9rem', flexShrink: 0, width: 24, textAlign: 'center' }}>
                    {change.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {change.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </PageContainer>
  );
}
