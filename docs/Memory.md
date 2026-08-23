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

**Active phase:** Phase 1 — Core Typing Engine Polish
**Last updated:** 2026-08-23
**Next task:** Manual smoke test of Phase 1 on desktop + mobile viewport; then remaining polish items from Phases.md before declaring Phase 1 done.

---

## Log

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
- Legacy certificate system (bronze/silver/gold/diamond + `/verify` + `/certificate/[id]`) predates the PRD; kept functional but not part of any active phase. Revisit in Phase 5/6.
- `submit_game_session` trusts client-computed WPM/accuracy (range-validates only). Server-side recomputation from raw keystrokes lands in Phase 3.
- ESLint has ~9 pre-existing `react-hooks/set-state-in-effect` warnings (localStorage reads on mount). Cosmetic, not blocking.

---

## Key Decisions Log

- Google + GitHub OAuth only, no email/password, to reduce auth maintenance surface (see Rules.md #3).
- Hand-rolled ThemeProvider instead of adding `next-themes`: keeps dependency count at zero new packages per Rules.md §2; theme key is `tmx-theme` in localStorage.
- Touch devices were previously hard-blocked with a "Keyboard Required" gate; replaced with a hidden-input capture approach so mobile users can actually play (Phase 1 requirement).
- Dark palette follows Design.md exactly (`#0A0A0A` bg / `#141414` card / `#F5F5F5` borders / blue accent); secondary surface darkens to `#1E1E1E` following shadcn's raised-surface convention.
