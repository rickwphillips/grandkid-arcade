# CLAUDE.md — Grandkid Games

## Project Overview
Browser-based mini-games for grandkids. Next.js 16 static export with PHP/MySQL backend, shared JWT auth with the portfolio site.

## Tech Stack
- **Framework**: Next.js 16 (App Router, static export for production)
- **React**: 19.x with TypeScript strict mode
- **UI**: MUI 7 + SCSS modules, autumn color theme (shared with portfolio & commander)
- **Backend**: PHP 8 + MySQL (no Composer)
- **Auth**: JWT (HS256), shared with portfolio site login at `/app/login/`

## URLs
- **Production**: `https://rickwphillips.com/app/projects/grandkid-games/`
- **Dev**: `http://localhost:3002` (Next.js) + `http://localhost:8082` (PHP)
- **API (prod)**: `https://rickwphillips.com/grandkid-api/`
- **API (dev)**: Proxied via Next.js rewrites to `localhost:8082`

## Development Commands
```bash
npm run dev            # Next.js on port 3002
npm run build          # Static export
npm run lint           # ESLint
npm run local-start    # Start PHP + Next.js + MySQL
npm run local-stop     # Stop all dev servers
```

## Database
- **Prod DB**: `rickwphi_app_grandkid` (Bluehost)
- **Dev DB**: `grandkid_arcade` (local MySQL)
- **Auth DB**: `rickwphi_auth` (shared, separate connection via `getAuthDB()`)
- **Secrets**: `GRANDKID_DB_*` constants in `~/auth_secrets_dev.php` (dev) / `~/auth_secrets.php` (prod)

## Architecture

### Game System
- Games registered in `app/lib/gameRegistry.ts` (slug, title, emoji, age range, category)
- Each game route: `app/games/<slug>/page.tsx`
- Scores submitted via `api.submitScore()`, stored in `game_plays` table
- Favorites toggled via `api.toggleFavorite()`, stored in `favorites` table

### Grandkid System
- `useGrandkid()` hook manages selected grandkid (persisted to localStorage)
- CRUD at `/grandkids/` page and `/php-api/grandkids.php` endpoint
- Games filtered by selected grandkid's age range

### API_BASE (environment-aware)
- **Dev**: `/php-api/` — proxied to `localhost:8082`
- **Prod**: `/grandkid-api/` — deployed to `~/public_html/grandkid-api/`

### Key Patterns
- All PHP endpoints: `require_once 'config.php'` + `require_once 'auth/middleware.php'`
- Helpers: `getDB()`, `getJSONInput()`, `sendJSON()`, `sendError()`
- Frontend: `'use client'`, mounted state pattern, DarkModeToggle fixed top-right
- PageContainer wraps sub-pages; AuthGuard wraps entire app in layout

## File Structure
```
grandkid-arcade/
├── app/
│   ├── components/     # Shared UI (AuthGuard, ThemeProvider, GameCard, etc.)
│   ├── games/          # Game routes (app/games/<slug>/page.tsx)
│   ├── grandkids/      # Grandkid management CRUD page
│   ├── lib/            # types, api, gameRegistry, useGrandkid hook
│   ├── theme/          # MUI theme config
│   ├── php-api/        # PHP backend (config, auth, endpoints)
│   ├── layout.tsx      # Root layout (ThemeProvider + AuthGuard)
│   └── page.tsx        # Home — game feed dashboard
├── scripts/            # Dev server scripts, DB setup
├── .vscode/            # Debug profiles
└── public/             # Static assets
```

## Adding a New Game
1. Add entry to `app/lib/gameRegistry.ts` with slug, title, emoji, age range, category
2. Create `app/games/<slug>/page.tsx` with game component
3. Use `useGrandkid()` hook to get selected player
4. Submit scores via `api.submitScore({ grandkid_id, game_slug, score, completed })`
