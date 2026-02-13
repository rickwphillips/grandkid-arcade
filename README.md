# Grandkid Games

Browser-based mini-games personalized for grandkids. Built with Next.js 16, Material UI, and a PHP/MySQL backend.

## Quick Start

```bash
npm install
mysql -u root < scripts/setup-local-db.sql
npm run dev
```

Then open http://localhost:3002 (requires auth token from portfolio login at localhost:3000).

## Adding Games

1. Register the game in `app/lib/gameRegistry.ts`
2. Create `app/games/<slug>/page.tsx`
3. Use the `useGrandkid()` hook and `api.submitScore()` for scoring

See `CLAUDE.md` for full architecture details.
