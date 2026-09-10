# TypeMaster X — Phases.md

Build strictly in this order. Do not start a phase until the previous one is working end-to-end. After finishing a phase, update Memory.md before moving on.

---

## Phase 0 — Foundation (mostly done)
- [x] Next.js + TypeScript + Tailwind + shadcn/ui setup
- [x] Basic typing test (guest, name-based, no auth)
- [x] Supabase project + `typing_results`-style table (legacy schema)
- [x] Deployed to Vercel

Status: complete, this is the existing live MVP.

---

## Phase 1 — Core Typing Engine Polish
Goal: make the typing test itself excellent before adding accounts.

- [x] Multiple durations: 15s / 30s / 60s
- [x] Real-time WPM, accuracy, errors, progress display
- [x] Result screen: WPM, accuracy, errors, characters, duration
- [x] Guest mode fully local (no forced login)
- [x] Dark / light / system theme toggle
- [x] Mobile-responsive typing test

Status: complete. Guest can take a test in any of the 3 durations, see live stats, and get a clean result screen, on both desktop and mobile. Real-device phone check still recommended.

---

## Phase 2 — Authentication (OAuth only)
Goal: users can sign in only when they choose to save/compete.

- [x] Enable Google OAuth in Supabase (code side done; enable provider + callback URL in Supabase dashboard)
- [x] Enable GitHub OAuth in Supabase (code side done; enable provider + callback URL in Supabase dashboard)
- [x] Disable email/password provider
- [x] `/auth/callback` route handler
- [x] `profiles` table + auto-create on first login
- [x] Auth-gated "Save Result" button (guest → login prompt → auto-save after login)
- [x] Basic nav: show avatar/username when logged in, "Sign in" when not

Status: complete (v0.9.0). Guests never see a name dialog — Play goes straight to typing. Scores save locally (`tmx-unsynced-scores`) for guests and sync to the DB on their next login. Certificates are auth-gated with a blur overlay + sign-in box.

Exit criteria: a guest can complete a test, click "Save Result," sign in with Google or GitHub, and land back with their result saved. ✅

---

## Phase 3 — Account-Based Leaderboard
Goal: replace name-based leaderboard with verified, account-linked entries.

- [ ] New `typing_results` schema linked to `user_id`
- [ ] Server-side WPM/accuracy recomputation from raw keystroke data (never trust client number)
- [ ] Basic anti-cheat: rate limit + impossible-score rejection
- [ ] Leaderboard page: all-time + weekly, filter by duration (15s/30s/60s)
- [ ] Legacy leaderboard data tagged "Legacy" and kept separate

Exit criteria: leaderboard only shows account-linked results; legacy data is preserved but visually separated; a fake/impossible score gets rejected.

---

## Phase 4 — Profile & Stats
Goal: give registered users a reason to keep coming back.

- [ ] Profile page: username, avatar, best WPM, average WPM, best accuracy, tests completed
- [ ] Test history list (recent tests, filterable by date range)
- [ ] WPM-over-time chart (Recharts)
- [ ] Streak tracking (consecutive days typed)

Exit criteria: a logged-in user can see their full typing history and a WPM trend chart.

---

## Phase 5 — Recognition (Achievements)
Goal: lightweight gamification, no certificates yet.

- [ ] `achievements` + `user_achievements` tables
- [ ] Simple badge set (First Test, 80 WPM, 100 WPM, 99% Accuracy, 100 Tests, 7-Day Streak)
- [ ] Achievements shown on profile
- [ ] Shareable result card (copy link / share to X, LinkedIn, WhatsApp)

Exit criteria: hitting a milestone unlocks a visible badge on the profile.

---

## Phase 6 — Certificates
Goal: only build once there's real user trust/traffic (do not start early).

- [ ] Certificate eligibility rules (min WPM, min accuracy, verified account)
- [ ] Certificate generation (server-side, not client-trusted)
- [ ] Unique certificate ID (`TMX-xxxx-XXXXXX`)
- [ ] Public verification page `/verify/[id]`
- [ ] Certificate status: Valid / Revoked

Exit criteria: a qualifying user can claim a certificate and anyone can verify it via public URL.

---

## Phase 7 — Typing Games
Goal: expand beyond the core test, only after Phases 1-6 are solid.

- [ ] Typing Race (vs bot first, multiplayer later)
- [ ] Word Rush
- [ ] Time Attack
- [ ] Survival mode
- [ ] Games work in guest mode; saving scores requires auth

---

## Phase 8 — Scale & Growth
Goal: long-term, only after real traction.

- [ ] Multiplayer races
- [ ] Friend challenges / tournaments
- [ ] Seasonal leaderboards
- [ ] Multi-language support
- [ ] SEO landing pages (`/typing-speed-test`, `/wpm-test`, etc.)
- [ ] Product analytics events

---

## Rule for Every Phase

1. Read PRD.md, Architecture.md, Rules.md, Design.md before starting.
2. Only build items listed in the current phase.
3. On completion, update Memory.md with: what was built, key decisions made, any deviations from this plan and why, and what's next.
