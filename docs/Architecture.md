# TypeMaster X — Architecture.md

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix primitives) |
| Backend / DB | Supabase (Postgres + Auth) |
| Auth | Supabase Auth — Google OAuth + GitHub OAuth only |
| Charts | Recharts |
| Icons | lucide-react |
| Hosting | Vercel |
| Analytics | Vercel Analytics |

No other backend framework, no separate API server. All server logic lives in Next.js Server Actions / Route Handlers, talking directly to Supabase.

---

## 2. High-Level App Flow

```
Browser
  │
  ▼
Next.js App (App Router)
  │
  ├── Client Components (typing engine, timers, live stats)
  │        → all typing logic runs LOCALLY, no network calls per keystroke
  │
  ├── Server Actions (app/actions.ts)
  │        → result submission, leaderboard queries, profile updates
  │        → only place that talks to Supabase for writes
  │
  └── Supabase
        ├── Auth (Google/GitHub OAuth, session cookies via @supabase/ssr)
        ├── Postgres (profiles, typing_results)
        └── RLS policies (per-user row access)
```

**Rule of thumb:** typing test = 100% client-side until the test ends. Only the final result is sent to the server, once.

---

## 3. Folder Structure

```
Typing-Master/
├── app/
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout, theme provider
│   ├── globals.css
│   ├── actions.ts                # Server actions (submit result, fetch leaderboard)
│   ├── game/
│   │   └── page.tsx              # Typing test page
│   ├── leaderboard/
│   │   └── page.tsx              # Full leaderboard page
│   ├── profile/
│   │   └── page.tsx              # User profile + stats (auth required)
│   └── auth/
│       └── callback/route.ts     # OAuth callback handler
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (do not hand-edit)
│   ├── typing-test.tsx           # Core typing engine component
│   ├── stats-bar.tsx             # Live WPM/accuracy/timer display
│   ├── result-card.tsx           # Post-test result screen
│   ├── leaderboard-table.tsx
│   ├── auth-button.tsx           # Google/GitHub sign-in buttons
│   └── theme-toggle.tsx
│
├── hooks/
│   ├── use-typing-engine.ts      # Core typing state machine
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   └── server.ts              # Server Supabase client (cookies-based)
│   ├── wpm.ts                     # WPM/accuracy calculation (pure functions)
│   ├── key-sound.ts
│   └── utils.ts
│
├── public/
├── styles/
│
├── PRD.md
├── Architecture.md
├── Rules.md
├── Phases.md
├── Design.md
├── Memory.md
└── README.md
```

---

## 4. Data Flow: Typing Test Submission

```
1. User finishes test (client-side timer ends)
2. Client has: raw keystroke log, correct/incorrect chars, duration, mode
3. Client calls submitResult() server action with raw data (NOT final WPM)
4. Server action:
     a. Recomputes WPM + accuracy from raw data (never trusts client's number)
     b. Checks rate limit (max 3 submissions/user/minute)
     c. Rejects impossible results (WPM > 250)
     d. Inserts into typing_results with user_id from session
5. Client refetches leaderboard (revalidate or client refetch)
```

---

## 5. Auth Flow

```
1. Guest clicks "Save Result"
2. supabase.auth.signInWithOAuth({ provider: 'google' | 'github' })
3. Redirect to provider → back to /auth/callback
4. Callback exchanges code for session (Supabase handles this)
5. profiles row auto-created on first login (DB trigger or first-write-check)
6. Redirect back to result screen, auto-submit the pending result
```

---

## 6. State Management

- No global state library (Redux/Zustand) needed at MVP scale.
- Typing engine state: local `useState`/`useReducer` inside `use-typing-engine.ts`.
- Auth/session state: read via Supabase server client in Server Components; client-side via `@supabase/ssr` browser client where needed (e.g. showing "logged in as X" in nav).
- Leaderboard data: fetched via Server Component (SSR) on page load, optionally revalidated client-side after a save.

---

## 7. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

That's it for MVP. No other secrets required client-side. Any future server-only secret (e.g. service_role key for admin tasks) must NEVER use the `NEXT_PUBLIC_` prefix.
