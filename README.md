# TypeMaster — Brutalist Typing Challenge

<p align="center">
  <a href="https://typing-speed-challenge-gamma.vercel.app/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Play_Now-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
</p>

A typing speed and accuracy game with a bold brutalist design. Type displayed text, get real-time WPM/accuracy feedback, save scores to a global leaderboard, and earn tiered certificates. No sign-in required — players identify by a nickname stored in `localStorage`.

## Features

- **4 text modes** — Normal, Numbers, Punctuation, Quotes
- **3 time limits** — 15s, 30s, 60s
- **Real-time stats** — WPM, accuracy, errors, progress update live as you type
- **Visual keyboard** — on-screen keyboard highlights pressed keys with audio feedback
- **Mechanical keyboard sounds** — synthesized via Web Audio API (no audio files)
- **Global leaderboard** — paginated, ranked by WPM then accuracy
- **Certificate system** — earn Bronze, Silver, Gold, or Diamond certificates based on performance
- **Certificate verification** — anyone can verify a certificate by ID
- **Player profile** — view stats, certificates, and game history
- **Touch device detection** — blocks gameplay on touch-only devices with a clear message
- **Accessibility** — skip-nav link, `prefers-reduced-motion` support, ARIA labels
- **Brutalist UI** — high-contrast, zero border-radius, brutal shadows

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui (New York style), Tailwind CSS v4 |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL) |
| Package Manager | Bun |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/ausafulislam/Typing-Master.git
cd Typing-Master
bun install
```

### 2. Set up environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

Go to your Supabase dashboard → **SQL Editor** and run the contents of `supabase/schema.sql`. This creates 3 tables with RLS policies and indexes:

- `game_sessions` — one row per player (best score only)
- `game_history` — append-only log of every game played
- `certificates` — earned certificates

### 4. Start the dev server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout (Geist fonts, analytics, skip-nav)
│   ├── page.tsx            # Landing page (hero, stats, leaderboard, name dialog)
│   ├── globals.css         # Tailwind v4 config, theme variables, brutalist utilities
│   ├── actions.ts          # Server actions (save scores, leaderboard, certificates)
│   ├── not-found.tsx       # Custom 404 page
│   ├── game/
│   │   ├── page.tsx        # Main typing game
│   │   ├── loading.tsx     # Suspense loading skeleton
│   │   └── error.tsx       # Error boundary
│   ├── profile/
│   │   └── page.tsx        # Player profile (stats, certs, history)
│   └── verify/
│       └── page.tsx        # Certificate verification
├── components/
│   ├── leaderboard.tsx     # Paginated leaderboard (desktop table + mobile cards)
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── use-toast.ts        # Toast notification state
│   └── use-mobile.ts       # Mobile breakpoint detection
├── lib/
│   ├── utils.ts            # cn() utility (clsx + tailwind-merge)
│   ├── constants.ts        # Leaderboard page size, certificate tiers, ID generator
│   ├── key-sound.ts        # Web Audio API keyboard sound synthesizer
│   ├── name-utils.ts       # Name suggestion generator
│   └── supabase/
│       └── server.ts       # Supabase server-side client (cookie-based SSR)
├── supabase/
│   └── schema.sql          # Database schema (3 tables + RLS + indexes)
├── public/                 # Favicons and static assets
├── .env.example            # Environment variable template
├── components.json         # shadcn/ui configuration
├── next.config.mjs         # Next.js config (security headers, Turbopack)
├── postcss.config.mjs      # PostCSS with @tailwindcss/postcss
└── tsconfig.json           # TypeScript config (strict, path aliases)
```

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — hero, personal stats, global leaderboard, name entry |
| `/game` | Typing game — text display, timer, live stats, virtual keyboard, results |
| `/profile` | Player profile — stats, certificates, game history (last 100 games) |
| `/verify` | Certificate verification — enter a certificate ID to check authenticity |

## Certificate Tiers

| Tier | Min WPM | Min Accuracy | Color | ID Prefix |
|---|---|---|---|---|
| Bronze | 40 | 80% | `#CD7F32` | `B` |
| Silver | 60 | 85% | `#C0C0C0` | `S` |
| Gold | 80 | 90% | `#FFD700` | `G` |
| Diamond | 100 | 95% | `#B9F2FF` | `D` |

Certificate IDs follow the format `TYM<Prefix>.<wpm_base36>.<accuracy_base36>` (e.g., `TYMB.00KK.XYZA`).

## Database Schema

### `game_sessions` (one row per player)
| Column | Type | Notes |
|---|---|---|
| `id` | bigint (PK) | Auto-generated |
| `name` | text | Unique — one row per player |
| `duration` | integer | 15, 30, or 60 |
| `wpm` | integer | 0–400 |
| `accuracy` | numeric | 0–100 |
| `errors` | integer | ≥ 0 |
| `created_at` | timestamptz | Auto-set |

### `game_history` (every game played)
| Column | Type | Notes |
|---|---|---|
| `id` | bigint (PK) | Auto-generated |
| `name` | text | Player nickname |
| `text_mode` | text | normal, numbers, punctuation, quotes |
| `duration` | integer | |
| `wpm` | integer | |
| `accuracy` | numeric | |
| `errors` | integer | |
| `created_at` | timestamptz | |

### `certificates` (earned certificates)
| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | e.g., `TYMB.00KK.XYZA` |
| `name` | text | Player nickname |
| `tier` | text | bronze, silver, gold, diamond |
| `wpm` | integer | |
| `accuracy` | numeric | |
| `created_at` | timestamptz | |

All tables have RLS enabled with public SELECT and INSERT policies.

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

### Other platforms

```bash
bun run build
bun run start
```

Ensure `NODE_ENV=production` is set for secure cookies.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |

## Scripts

```bash
bun dev          # Start dev server (Turbopack)
bun run build    # Production build
bun run start    # Start production server
bun run lint     # Run ESLint
```

## License

MIT © 2026 Ausaf Ul Islam
