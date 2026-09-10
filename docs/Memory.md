# TypeMaster X — Memory.md

This file is the AI's persistent progress log. Update it after every meaningful chunk of work, so a new chat/session/tool can pick up context without re-reading the whole codebase.

Do not create this file at project start — add it once coding begins. This is the starting template; replace the example entry with real entries as work happens.

---

## How to Update This File

After finishing a task or phase step:
1. Add a new dated entry at the top of the Log (most recent first).
2. State what was built/changed, in plain language.
3. Note any deviation from PRD.md / Architecture.md / Rules.md / Phases.md, and why.
4. Note what's next (the very next task, not the whole remaining roadmap).
5. Keep entries short — this is a log, not documentation. Link to code instead of pasting large blocks.

---

## Current Status

**Active phase:** Phase 2 — Authentication (OAuth only) — implemented, committed at v0.9.0
**Last updated:** 2026-09-10
**Next task:** Enable Google + GitHub OAuth providers in the Supabase dashboard (set the `/auth/callback` redirect URL), then do the real-device mobile check and confirm the dark theme visually.

---

## Log

### 2026-09-10 — Phase 2 authentication (v0.9.0)
**Phase:** Phase 2
**Done:**
- Removed the name dialog entirely — clicking Play goes straight to typing. Designed a 3-step flow: (1) Play → type; (2) autosave; (3) if user is not signed in, score stores in `localStorage` (`tmx-unsynced-scores`); if signed in through Google/GitHub, it syncs to `typing_results` in Supabase and syncs to the database.
- New account-based schema: `profiles` + `typing_results` tables with RLS; `handle_new_user()` trigger auto-creates a profile on first login.
- New auth files: `lib/supabase/client.ts`, `middleware.ts` (session refresh). Auth UI: `components/auth-provider.tsx` (useAuth/AuthProvider), `auth-button.tsx` (Google + GitHub buttons, avatar + sign out), `components/score-syncer.tsx` (login → sync previous guest scores → clear key). `app/auth/callback/route.ts` + `app/auth/auth-code-error/page.tsx` handle the OAuth return trip; navbar now shows avatar/username or Sign in.
- Homepage rewritten: no name dialog, "Start Typing Test" goes straight to `/game`, guest sees "Sign in" prompt, signed-in users see their stats. Game page rewritten: removes all name/nickname code, saves via `saveTypedResult` (signed in) or `localStorage` (guest), "Save Locally" unsaved scores button, sign-in link.
- Profile page rewritten: guests blocked behind a blur overlay + "Sign In Required" prompt with sign-in buttons; all stats/ranks/history load from the DB.
- `app/actions.ts` rewritten: removed obsolete legacy actions (`saveGameSession`, `checkNameExists`, `getPlayerStats`, `awardCertificates`, `getPlayerCertificates`, `getPlayerGameHistory`), added 8 new account actions.
- `supabase/schema.sql` synced with new tables (guard rails: WPM/accuracy/other validation on new tables, RLS, trigger) and revokes on legacy RPCs
- Hardening: revoked `EXECUTE` on `handle_new_user` (trigger-only) + on legacy `submit_game_session`/`award_certificate` RPCs (no longer called by app) to shrink attack surface (advisors WARN → resolved)

**Deviations from plan:**
- Phase 2 in Phases.md said "enable Google OAuth" and then list name-dialog-based flow; we implemented local-first store + auto-cleanup sync as the save path per user spec, plus Google *and* GitHub OAuth, and certificates are auth-gated with a blur box (instead of gating the whole flow). Verified inline.

**Next (post-Phase-2 checklist):** vercel-env-based Supabase provider configuration (Google + GitHub redirect URLs pointing at `/auth/callback`), real-device mobile check, dark-theme visual confirmation.

### 2026-09-04 — Dark theme palette polish (v0.8.0)
**Phase:** Phase 1 (polish)
**Done:**
- Softened dark palette: foreground dimmed from `#fafafa` to `#e8e8ec` (fixes brutal-shadow glow and blinding inverted slabs like keyboard/timer in one lever — both use `var(--foreground)`), borders changed to `#a1a1aa` (softer gray), surfaces stepped: bg `#0a0a0a` → card `#16161a` → secondary `#232329`, muted-foreground brightened to `#b4b4bc`
- Zero component class changes — entire fix via CSS variables only

**Known limitation (acceptable):** keyboard container, timer, and profile headers still use `bg-foreground` inversion — now light-gray instead of blinding white. Full un-inversion needs component edits; can be done later if user still wants it after seeing this fix.

### 2026-08-23 — Zero-warning lint + leaderboard cap (v0.7.0)
**Phase:** Phase 1 (polish)
**Done:**
- Eliminated all 12 `react-hooks/set-state-in-effect` warnings: new shared `hooks/use-local-storage-state.ts` (useSyncExternalStore-backed), theme provider/toggle rewritten as an external store, homepage dialog validation moved to event handlers, profile data fetch restructured, certificate verify URL via server/client snapshots, touch hint now CSS-only (`coarse` custom variant in globals.css)
- Game initial text is now deterministic (`INITIAL_TEXT`) instead of a mount-effect `resetGame()` — no hydration swap, randomization still happens on every restart/mode change
- Leaderboard capped at top 50 entries (`LEADERBOARD_PAGE_SIZE = 50`, `MAX_LEADERBOARD_ENTRIES = 50`, enforced in `getLeaderboard`)

**Deviations from plan:** None.

**Known tradeoff:** First page load always starts with the same sample text (deterministic SSR); subsequent restarts randomize. Accepted to avoid setState-in-effect and hydration swaps.

### 2026-08-23 — Phase 1 core implementation
**Phase:** Phase 1
**Done:**
- Baseline commit: pruned ~50 unused shadcn/ui components, deleted unused `hooks/`, hardened `supabase/schema.sql` (v0.5.0 SECURITY DEFINER RPCs), added `docs/`
- Dark/light/system theme: `.dark` palette per Design.md, hand-rolled ThemeProvider (`components/theme-provider.tsx`), toggle in navbar, pre-paint script against FOUC
- Touch support: removed "Keyboard Required" gate; hidden capture input over typing area summons mobile keyboard (`app/game/page.tsx`)
- Result screen now shows Characters + Duration tiles; WPM/accuracy/progress math extracted to `lib/wpm.ts`
- Homepage name dialog got a "Just type" skip link

**Deviations from plan:**
- Certificates + Numbers/Punctuation/Quotes text modes already exist from the pre-PRD MVP (Phase 6 / PRD-Phase-2 scope). Decision: keep them functional, tag as legacy until their phases arrive.
- Architecture.md folder plan (hooks/use-typing-engine, stats-bar, result-card components) not followed — engine lives in `app/game/page.tsx`. Acceptable for now; refactor if a later phase demands it.
- Server does not yet recompute scores from raw keystrokes (Rules.md §4) — deferred to Phase 3 anti-cheat, which rebuilds submission anyway.

**Next:** Verify Phase 1 exit criteria end-to-end, update docs, bump to 0.6.0.

---

## Known Issues / Tech Debt

- Leaderboard uses legacy name-based schema (`game_sessions`), will be migrated to account-based in Phase 3.
- Legacy certificate system (bronze/silver/gold/diamond + `/verify` + `/certificate/[id]`) predates the PRD; kept functional but not part of any active phase. Revisit in Phase 5/6. Phase 2 now auth-gates the certificate display on the profile (blur box) so they are no longer visible to guests.
- `submit_game_session` trusts client-computed WPM/accuracy (range-validates only). Server-side recomputation from raw keystrokes lands in Phase 3.
- `integer` `wpm` values still land in `typing_results` — decimals are dropped by the DB. Fine for now; Phase 3 recomputation may revisit.
- OAuth provider config (Google + GitHub `redirectTo` URLs → `/auth/callback`) must be done manually in the Supabase dashboard; not scriptable from here.

---

## Key Decisions Log

- Google + GitHub OAuth only, no email/password, to reduce auth maintenance surface (see Rules.md #3).
- Hand-rolled ThemeProvider instead of adding `next-themes`: keeps dependency count at zero new packages per Rules.md §2; theme key is `tmx-theme` in localStorage.
- Touch devices were previously hard-blocked with a "Keyboard Required" gate; replaced with a hidden-input capture approach so mobile users can actually play (Phase 1 requirement).
- Dark palette uses softened tones (foreground `#e8e8ec`, borders `#a1a1aa`, surfaces `#0a0a0a`/`#16161a`/`#232329`) to avoid the glare issues of pure-white borders/shadows on near-black backgrounds.
- Phase 2 is local-first: guests never enter a name; scores persist in `localStorage` (`tmx-unsynced-scores`) and auto-sync to `typing_results` the moment the user signs in. This satisfies the user spec (Play → top → autosave → optional sign-in) rather than the original name-dialog flow.
- No new dependencies for auth: `@supabase/supabase-js` + `@supabase/ssr` (already present) power session handling, middleware, and server actions.
