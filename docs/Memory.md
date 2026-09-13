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

**Active phase:** Phase 2 complete (v0.9.0) + Phase 3 partial — leaderboard is now account-based (`leaderboard` view over `typing_results` + `profiles`); edge-case + UI polish rounds (v0.10.0/v0.11.0) and a dead-code/doc-cleanup round (v0.11.1) all uncommitted in one working tree.
**Last updated:** 2026-09-13
**Next task:** Final verification (tsc + lint + build), prod smoke test, then commit the combined working tree.

---

## Log

### 2026-09-13 — Dead code + doc cleanup, leaderboard rank consistency (v0.11.1)
**Phase:** Phase 3 partial (cleanup)
**Done:**
- **Removed unused code:** `generateCertificateId` from `lib/constants.ts` (cert IDs are now minted by the DB trigger in `schema.sql` §8); deleted `components/ui/input.tsx` (no imports anywhere); removed unused `getUserProfile` server action from `app/actions.ts`.
- **Deduplicated tier lookup:** added `getTierConfig(tier)` to `lib/constants.ts` (single source of truth) and switched `components/certificate-view.tsx` + `app/verify/page.tsx` to it (removes 3 near-identical local `CERTIFICATE_TIERS.find` helpers).
- **Leaderboard rank fix:** `getUserRank` previously counted strictly-ahead **rows** in `typing_results`, inflating rank for people who played many games and including users with no display name. Now counts distinct users via the `leaderboard` view, so the/profile homepage rank matches the board.
- **Docs synced to current reality:** `README.md` (account schema, leaderboard view, cert trigger, real folder structure/no `name-utils.ts`, OAuth setup steps), `docs/Architecture.md` (real folder tree, drop Recharts, honest §4 data-flow noting no server-side recompute yet, `proxy.ts` naming), `docs/Phases.md` (checked off the account-based leaderboard items delivered), `docs/Memory.md` (this entry + stale Known Issues).
- Version bumped 0.11.0 → 0.11.1 (`package.json` + `lib/constants.ts`).

**Deviations from plan:** No new features; the `getUserRank` fix is the one behavior change (bug fix from the v0.11 leaderboard migration).

**Next:** Run tsc/lint/build, smoke-test prod, then commit the whole uncommitted round (v0.10.0 → v0.11.1).

### 2026-09-11 — Full UI/UX + responsiveness pass (v0.11.0)

### 2026-09-11 — Full UI/UX + responsiveness pass (v0.11.0)
**Phase:** Phase 2 (polish)
**Done:**
- Audited every page/component against the Vercel Web Interface Guidelines and improved UX/responsiveness while keeping the neubrutalist design system (Design.md).
- **Navbar:** now `sticky top-0`, keeps Home/Play/Profile/Verify always visible with active-tab pressed styling, wraps instead of hiding on small screens; Footer gained a real nav (Home / Play / Verify).
- **Homepage:** added a 3-step "How It Works" strip (Play → Type → Track), `text-balance` headlines, `text-pretty` body copy.
- **Game:** progress bar is a real `role="progressbar"` with ARIA values, timer has `role="timer"` + label, visual keyboard marked `aria-hidden` (decorative), controls stay wrapped on mobile.
- **Profile:** added back-to-home link, locale-aware dates (`toLocaleDateString(undefined, ...)`), certificate ID wraps safely (`break-all min-w-0`) with copy-button `aria-live` feedback, loading text uses `…`.
- **Verify:** removed mobile-hostile `autoFocus`, added `name`/`inputMode`/`enterKeyHint` on the ID input, result cards announce via `role="status" aria-live="polite"`.
- **Leaderboard:** scroll container got `overscroll-contain`, pagination/retry buttons switched from `transition-all` → `transition-brutal`, loading text is `…` with `role="status"`.
- **Dialog component:** content now `max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain` (small screens scroll instead of clipping).
- **Certificate view:** toolbar respects `env(safe-area-inset-top)`, footer signature/id/verify blocks wrap on mobile instead of overflowing.
- UI strings use `…` instead of `...`; all headings get `text-balance`; unused `ui/input.tsx` was deleted in the 2026-09-13 cleanup round.

**Deviations from plan:** None — polish only, no design-system changes, no new dependencies.

**Note on working tree:** the v0.10.0 edge-case round (sync retry, space-bar bug, corrupt-JSON guard, GitHub sign-in, open-redirect guard, hero stats) AND this v0.11.0 UI pass are both uncommitted in one working tree. Version now reads 0.11.0.

**Next:** Commit the combined round; real-device visual pass; dashboard OAuth redirect check.

### 2026-09-11 — Edge-case fixes + security hardening + navbar/hero polish (v0.10.0)
**Phase:** Phase 2 (hardening/polish)
**Done:**
- **DB security fix (the real gap):** earlier hardening only revoked legacy RPCs `from public`. New migration `revoke_legacy_rpcs_and_award_certs_on_save` also revokes `submit_game_session` and `award_certificate` from `anon` and `authenticated`, and replaces the legacy name-based `award_certificate` RPC with a DB trigger: `award_certificates_on_result()` (SECURITY DEFINER, no grants) fires AFTER INSERT on `typing_results` and auto-awards a certificate per tier (bronze/silver/gold/diamond) keyed to the profile's `display_name`. Verified live: synthetic 105/96 result produced gold + diamond certs instantly; test artifacts then deleted. Only remaining advisor WARN is `auth_leaked_password_protection` (dashboard-level; irrelevant for OAuth-only).
- `supabase/schema.sql` synced: revokes now target `public, anon, authenticated`, plus section 8 with the award-cert trigger SQL.
- **Sync retry fixed** (`components/score-syncer.tsx`): flag set only after a successful sync (retries on next load instead of abandoning), reset on sign-out so a guest→login replay in the same session syncs again, corrupt JSON clears the key.
- **Game fixes** (`app/game/page.tsx`): space/Enter on a focused button no longer types a char into the test; guest save validates corrupt JSON and caps local list at the latest 50 (matches server sync limit); Save button is disabled while auth is loading (kills the "Save Locally" vs "Save Score" flash); dialog sign-in now offers Google AND GitHub and passes `next=/game` so the player lands back on the game.
- **Open-redirect guard** (`app/auth/callback/route.ts`): `next` must be a same-origin path (rejects `//...` and `\`); profile passes `next=/profile`.
- **Navbar rework** (`components/navbar.tsx`): Home/Play/Profile/Verify are always visible (no more hiding the current page), active tab gets a pressed-down `bg-foreground` style via `usePathname`, rows wrap on small screens instead of hiding; AuthButton labels (Google/GitHub/name) always shown.
- **Homepage hero** (`app/page.tsx`): signed-in users see live stat tiles pulled from the DB (tests, best WPM, avg accuracy, rank); guests keep the Google/GitHub sign-in prompt.

**Deviations from plan:** None (all fixes were already documented as Known Issues / non-blockers in the previous round).

**Next:** Commit v0.10.0; real-device visual pass on navbar wrapping + hero tiles; confirm OAuth redirect URLs in the dashboard.

### 2026-09-10 — Phase 2 authentication (v0.9.0)
**Phase:** Phase 2
**Done:**
- Removed the name dialog entirely — clicking Play goes straight to typing. Designed a 3-step flow: (1) Play → type; (2) autosave; (3) if user is not signed in, score stores in `localStorage` (`tmx-unsynced-scores`); if signed in through Google/GitHub, it syncs to `typing_results` in Supabase and syncs to the database.
- New account-based schema: `profiles` + `typing_results` tables with RLS; `handle_new_user()` trigger auto-creates a profile on first login.
- New auth files: `lib/supabase/client.ts`, `proxy.ts` (session refresh middleware). Auth UI: `components/auth-provider.tsx` (useAuth/AuthProvider), `auth-button.tsx` (Google + GitHub buttons, avatar + sign out), `components/score-syncer.tsx` (login → sync previous guest scores → clear key). `app/auth/callback/route.ts` + `app/auth/auth-code-error/page.tsx` handle the OAuth return trip; navbar now shows avatar/username or Sign in.
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

- Legacy `game_sessions` / `game_history` tables (name-based, pre-Phase-2) are still created in `supabase/schema.sql` but are **empty and unread** — the leaderboard now serves the account-based `leaderboard` view (best result per `typing_results` user, joined with `profiles.display_name`). Safe to drop from the schema later.
- Certificate system (bronze/silver/gold/diamond + `/verify` + `/certificate/[id]`) predates the PRD; still functional and now auto-awarded by DB trigger, but certificates are keyed to the profile `display_name` (which the user can't currently change). Profile removes the guest blur → signed-in users see their certs.
- `saveTypedResult` trusts client-computed WPM/accuracy (range-validates only). Server-side recomputation from raw keystrokes + rate limiting lands in Phase 3.
- `integer` `wpm` values still land in `typing_results` — decimals are dropped by the DB. Fine for now; Phase 3 recomputation may revisit.
- OAuth provider config (Google + GitHub `redirectTo` URLs → `/auth/callback`) was set up in the Supabase dashboard by the user; keep an eye on it if URLs change.

---

## Key Decisions Log

- Google + GitHub OAuth only, no email/password, to reduce auth maintenance surface (see Rules.md #3).
- Hand-rolled ThemeProvider instead of adding `next-themes`: keeps dependency count at zero new packages per Rules.md §2; theme key is `tmx-theme` in localStorage.
- Touch devices were previously hard-blocked with a "Keyboard Required" gate; replaced with a hidden-input capture approach so mobile users can actually play (Phase 1 requirement).
- Dark palette uses softened tones (foreground `#e8e8ec`, borders `#a1a1aa`, surfaces `#0a0a0a`/`#16161a`/`#232329`) to avoid the glare issues of pure-white borders/shadows on near-black backgrounds.
- Phase 2 is local-first: guests never enter a name; scores persist in `localStorage` (`tmx-unsynced-scores`) and auto-sync to `typing_results` the moment the user signs in. This satisfies the user spec (Play → top → autosave → optional sign-in) rather than the original name-dialog flow.
- No new dependencies for auth: `@supabase/supabase-js` + `@supabase/ssr` (already present) power session handling, proxy middleware, and server actions.
