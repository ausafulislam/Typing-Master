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
**Last updated:** (fill in date)
**Next task:** (fill in)

---

## Log

### (example entry — replace/delete once real work starts)
**Date:** —
**Phase:** Phase 0
**Done:**
- Initial typing test MVP live (name-based, no auth)
- Supabase legacy `game_sessions` table connected
- Deployed to Vercel

**Deviations from plan:** None yet, this is the pre-PRD baseline.

**Next:** Start Phase 1 — add 15s/30s/60s duration options and polish the result screen.

---

## Known Issues / Tech Debt

(Running list — add here whenever something is deliberately deferred or a shortcut is taken.)

- Example: Leaderboard uses legacy name-based schema, will be migrated to account-based in Phase 3.

---

## Key Decisions Log

(Only add decisions that aren't obvious from the PRD/Architecture/Rules docs themselves — e.g. a tradeoff made mid-build.)

- Example: Chose Google + GitHub OAuth only, no email/password, to reduce auth maintenance surface (see Rules.md #3).
