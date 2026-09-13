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
  │        → result submission, local-score sync, leaderboard, rank, certificates
  │        → only place that talks to Supabase for writes
  │
  └── Supabase
        ├── Auth (Google/GitHub OAuth, session cookies via @supabase/ssr, refreshed by proxy.ts)
        ├── Postgres (profiles, typing_results, certificates, leaderboard view)
        └── RLS policies (per-user row access) + triggers (profile auto-create, cert auto-award)
```

**Rule of thumb:** typing test = 100% client-side until the test ends. Only the final result is sent to the server, once.

---

## 3. Folder Structure

```
Typing-Master/
├── app/
│   ├── page.tsx                 # Homepage (hero + stat tiles + leaderboard)
│   ├── layout.tsx               # Root layout, theme provider
│   ├── globals.css
│   ├── actions.ts               # Server actions (save/sync result, leaderboard, rank, certs)
│   ├── game/
│   │   ├── page.tsx             # Whole typing engine lives here (no split components yet)
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── profile/
│   │   └── page.tsx             # User profile + stats (auth required)
│   ├── verify/
│   │   └── page.tsx             # Certificate verification
│   ├── certificate/
│   │   └── [id]/page.tsx        # Shareable certificate view
│   └── auth/
│       ├── callback/route.ts    # OAuth code exchange
│       └── auth-code-error/page.tsx
│
├── components/
│   ├── ui/                      # shadcn/ui primitives (button, dialog — keep minimal)
│   ├── navbar.tsx               # Responsive nav: desktop links + mobile sidebar drawer
│   ├── leaderboard.tsx          # Paginated board, reads getLeaderboard() server action
│   ├── auth-button.tsx          # Google/GitHub sign-in + avatar/sign-out
│   ├── auth-provider.tsx        # useAuth session context (useSyncExternalStore)
│   ├── score-syncer.tsx         # Syncs pending guest scores on sign-in
│   ├── certificate-view.tsx     # Print/PDF certificate
│   ├── footer.tsx
│   ├── theme-provider.tsx       # Hand-rolled theme store (no next-themes)
│   └── theme-toggle.tsx
│
├── hooks/
│   └── use-local-storage-state.ts   # useSyncExternalStore-backed localStorage
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client (@supabase/ssr)
│   │   └── server.ts            # Server Supabase client (cookies-based)
│   ├── constants.ts             # Leaderboard caps, certificate tiers, getTierConfig, version
│   ├── wpm.ts                   # WPM/accuracy/progress calculation (pure functions)
│   ├── key-sound.ts             # Web Audio keyboard sounds
│   └── utils.ts                 # cn() merge utility
│
├── supabase/
│   └── schema.sql               # Idempotent schema: tables + RLS + view + triggers + grants
├── proxy.ts                     # Session refresh middleware (@supabase/ssr)
├── public/
├── docs/                        # PRD, Architecture, Rules, Phases, Design, Memory
├── README.md
└── ...config files (next.config.mjs, tsconfig.json, postcss.config.mjs)
```

---

## 4. Data Flow: Typing Test Submission

```
1. User finishes test (client-side timer ends)
2. Client computes WPM/accuracy/errors via lib/wpm.ts from local keystroke state
3. Client calls saveTypedResult() server action with the final numbers
4. Server action:
     a. Requires an authenticated session (guest saves go to localStorage instead)
     b. Range-validates server-side (wpm ≤ 400, accuracy ≤ 100, duration ≤ 300, etc.)
     c. Inserts into typing_results under session user_id
5. DB trigger award_certificates_on_result() auto-awards any qualifying certificate
6. Client refetches leaderboard/rank (server action on next render)
```

> Note: Phase 3 will replace step 3–4 with server-side recomputation from raw keystroke data + rate limiting. Today the server range-validates but trusts the client-computed numbers.

---

## 5. Auth Flow

```
1. Guest clicks "Sign in" / "Save Score" → AuthButton opens sign-in dialog
2. supabase.auth.signInWithOAuth({ provider: 'google' | 'github', options: { redirectTo: '/auth/callback?next=...' } })
3. Provider → back to /auth/callback (open-redirect-guarded `next` param)
4. Callback exchanges code for session, redirects to `next`
5. profile row auto-created by handle_new_user() trigger on auth.users insert
6. /profile passes next=/profile; host passes next=/game
7. score-syncer pushes any pending localStorage scores (tmx-unsynced-scores) on sign-in
```

---

## 6. State Management

- No global state library (Redux/Zustand) needed at MVP scale.
- Typing engine state: local hooks inside `app/game/page.tsx`.
- Auth/session state: `components/auth-provider.tsx` (useSyncExternalStore against supabase client session/channel) + server client in Server Components.
- Theme state: external store in `components/theme-provider.tsx`, key `tmx-theme`.
- Leaderboard/profile data: fetched via server actions in Server Components (`app/actions.ts`), client components re-run them after saves.

---

## 7. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

That's it for MVP. No other secrets required client-side. Any future server-only secret (e.g. service_role key for admin tasks) must NEVER use the `NEXT_PUBLIC_` prefix.