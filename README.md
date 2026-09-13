# TypeMaster — Brutalist Typing Challenge

<p align="center">
  <a href="https://typemaster-x.vercel.app/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Play_Now-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
</p>

A typing speed and accuracy game with a bold brutalist design. Type displayed text, get real-time WPM/accuracy feedback, save scores to your account, and climb a global leaderboard. Anyone can type instantly — sign in with Google or GitHub only when you want to save, compete, and earn certificates.

## Features

- **4 text modes** — Normal, Numbers, Punctuation, Quotes
- **3 time limits** — 15s, 30s, 60s
- **Real-time stats** — WPM, accuracy, errors, progress update live as you type
- **Local-first scores** — guests save locally (`localStorage`); scores auto-sync to your account on sign-in
- **OAuth sign-in** — Google + GitHub only (no email/password)
- **Account-based leaderboard** — best score per user, joined with the profile display name
- **Player profile** — stats, rank, certificates, and game history (last 100 games)
- **Dark / light / system theme** — toggle in the navbar, respects `prefers-color-scheme`, no flash on load
- **Mobile support** — playable on touch devices via a hidden input that summons the on-screen keyboard
- **Visual keyboard** — on-screen keyboard highlights pressed keys with audio feedback
- **Mechanical keyboard sounds** — synthesized via Web Audio API (no audio files), mutable
- **Certificate system** — Bronze, Silver, Gold, or Diamond certificates auto-awarded by a DB trigger when a result qualifies
- **Certificate verification** — anyone can verify a certificate by ID
- **Accessibility** — skip-nav link, `prefers-reduced-motion` support, ARIA labels
- **Brutalist UI** — high-contrast, zero border-radius, brutal shadows

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui (New York style), Tailwind CSS v4 |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL + Auth) |
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

Go to your Supabase dashboard → **SQL Editor** and run the contents of `supabase/schema.sql`. This creates the account-based tables (`profiles`, `typing_results`, `certificates`), the `leaderboard` view, RLS policies, indexes, the profile auto-create trigger, and the certificate auto-award trigger.

Also enable the **Google** and **GitHub** auth providers in **Authentication → Providers**, pointing their redirect URLs at `{site-url}/auth/callback`.

### 4. Start the dev server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout (Geist fonts, theme init, analytics, skip-nav)
│   ├── page.tsx            # Landing page (hero, stat tiles, leaderboard)
│   ├── globals.css         # Tailwind v4 config, light+dark themes, brutalist utilities
│   ├── actions.ts          # Server actions (save/sync scores, leaderboard, rank, certs)
│   ├── error.tsx           # Global error boundary
│   ├── not-found.tsx       # Custom 404 page
│   ├── game/
│   │   ├── page.tsx        # Main typing game
│   │   ├── loading.tsx     # Suspense loading skeleton
│   │   └── error.tsx       # Error boundary
│   ├── profile/
│   │   └── page.tsx        # Player profile (stats, rank, certs, history) — auth required
│   ├── verify/
│   │   └── page.tsx        # Certificate verification
│   ├── certificate/
│   │   └── [id]/page.tsx   # Shareable certificate view (print/PDF)
│   └── auth/
│       ├── callback/route.ts         # OAuth callback handler
│       └── auth-code-error/page.tsx  # OAuth failure page
├── components/
│   ├── navbar.tsx          # Responsive navbar (desktop nav + mobile sidebar drawer)
│   ├── leaderboard.tsx     # Paginated leaderboard (desktop table + mobile cards)
│   ├── auth-button.tsx     # Google/GitHub sign-in, avatar + sign out
│   ├── auth-provider.tsx   # useAuth session context
│   ├── score-syncer.tsx    # Guest ↓ sync local scores on sign-in
│   ├── certificate-view.tsx
│   ├── footer.tsx
│   ├── theme-provider.tsx  # Light/dark/system theme context (no external deps)
│   ├── theme-toggle.tsx
│   └── ui/                 # shadcn/ui components (button, dialog)
├── hooks/
│   └── use-local-storage-state.ts   # useSyncExternalStore-backed persistence
├── lib/
│   ├── utils.ts            # cn() utility (clsx + tailwind-merge)
│   ├── wpm.ts              # Pure WPM/accuracy/progress calculations
│   ├── constants.ts        # Leaderboard caps, certificate tiers, version
│   ├── key-sound.ts        # Web Audio API keyboard sound synthesizer
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       └── server.ts       # Server Supabase client (cookie-based SSR)
├── supabase/
│   └── schema.sql          # Database schema (tables + RLS + view + triggers + grants)
├── proxy.ts                # Session refresh middleware
├── docs/                   # PRD, Architecture, Rules, Phases, Design, Memory
├── public/                 # Favicons and static assets
├── .env.example            # Environment variable template
├── components.json         # shadcn/ui configuration
├── next.config.mjs         # Next.js config (image host allow-list)
├── postcss.config.mjs      # PostCSS with @tailwindcss/postcss
└── tsconfig.json           # TypeScript config (strict, path aliases)
```

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — hero, personal stat tiles, global leaderboard |
| `/game` | Typing game — text display, timer, live stats, virtual keyboard, results |
| `/profile` | Player profile — stats, certificates, game history (auth required) |
| `/verify` | Certificate verification — enter a certificate ID to check authenticity |
| `/certificate/[id]` | Shareable certificate view with print/PDF support |
| `/auth/callback` | OAuth return trip (exchanges code for a session) |

## Certificate Tiers

| Tier | Min WPM | Min Accuracy | Color | ID Prefix |
|---|---|---|---|---|
| Bronze | 40 | 80% | `#CD7F32` | `B` |
| Silver | 60 | 85% | `#C0C0C0` | `S` |
| Gold | 80 | 90% | `#FFD700` | `G` |
| Diamond | 100 | 95% | `#B9F2FF` | `D` |

Certificate IDs follow the format `TYM<Prefix>.<3 chars>.<4 chars>` (11 alphanumeric characters), e.g. `TYMB.ABC.1234`, generated server-side by the award trigger.

## Database Schema

Tables are created idempotently in `supabase/schema.sql`. The active schema is account-based; the legacy `game_sessions` / `game_history` tables (name-based) are retained in the SQL but no longer written or read by the app.

### `profiles` (one row per auth user)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | References `auth.users`, auto-created by `handle_new_user()` trigger |
| `display_name` | text | From OAuth `full_name` / `name`, else email local-part |
| `avatar_url` | text | From OAuth `avatar_url` / `picture` |
| `created_at` | timestamptz | Auto-set |

### `typing_results` (one row per game)
| Column | Type | Notes |
|---|---|---|
| `id` | bigint (PK) | Auto-generated |
| `user_id` | uuid (FK → profiles) | Owner |
| `wpm` | integer | 0–400 |
| `accuracy` | numeric | 0–100 |
| `errors` | integer | ≥ 0 |
| `duration` | integer | 15, 30, or 60 |
| `text_mode` | text | normal, numbers, punctuation, quotes |
| `created_at` | timestamptz | Auto-set |

### `certificates` (earned certificates)
| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | e.g. `TYMB.ABC.1234`, generated by trigger |
| `name` | text | Profile display name at time of award |
| `tier` | text | bronze, silver, gold, diamond |
| `wpm` | integer | |
| `accuracy` | numeric | |
| `created_at` | timestamptz | |

### `leaderboard` (view)
Best score per authenticated user (best WPM, then accuracy, then fewest errors), joined with the profile display name. Naturally excludes users with no display name. Read-only; served via public SELECT grants.

### Writes, RLS, and triggers
- Every table has RLS enabled. Users can read/insert only their own `typing_results` and `profiles` rows; public SELECT is granted for leaderboard and verification reads.
- Writes go directly through RLS (authenticated user only); there are no public INSERT/UPDATE policies.
- `handle_new_user()` (SECURITY DEFINER, trigger-only) auto-creates a profile on first login.
- `award_certificates_on_result()` (SECURITY DEFINER, trigger-only) runs AFTER INSERT on `typing_results` and awards a certificate for every tier the result qualifies for. Certificate IDs are generated inside the trigger, so clients never mint certificates.

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Configure Google/GitHub providers in Supabase, then add the Supabase redirect URLs to the provider dashboards
5. Deploy — Vercel auto-detects Next.js

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