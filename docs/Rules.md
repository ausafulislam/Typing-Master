# TypeMaster X — Rules.md

Read this before writing any code. These are hard boundaries, not suggestions.

## 1. Scope Discipline

- Only build what the current Phase (see Phases.md) asks for. Do not add features from later phases "while you're in there."
- Do not build certificates, achievements, games, or multiplayer until their explicit phase is reached, even if it seems easy to bolt on.
- If a request conflicts with PRD.md or Phases.md scope, flag it instead of silently building it.

## 2. Tech Stack — Do NOT Deviate

**Use only:**
- Next.js (App Router, not Pages Router)
- React + TypeScript
- Tailwind CSS
- shadcn/ui for components (check `components/ui/` before building a custom one — don't duplicate)
- Supabase for auth + database
- Recharts for any charts
- lucide-react for icons

**Do NOT introduce:**
- Redux, Zustand, Jotai, or any global state library (not needed at this scale)
- A second CSS approach (styled-components, Emotion, CSS modules) — Tailwind only
- A different backend (Express, Fastify, separate API server) — Next.js Server Actions/Route Handlers only
- A different auth provider or email/password auth — Google + GitHub OAuth via Supabase only
- ORM libraries (Prisma, Drizzle) unless explicitly requested — use Supabase client directly
- Any new npm package without checking if an existing dependency already covers the need

## 3. Auth Rules

- Email/password auth is disabled. Only `signInWithOAuth` with `google` and `github` providers.
- Never build a custom password reset, email verification, or credential storage flow.
- Auth must never be requested before a user tries to save/compete — guest typing always works first.

## 4. Data & Security Rules

- Never trust client-submitted WPM/accuracy as final. Server must recompute from raw keystroke data before inserting into the database.
- All Supabase tables must have Row Level Security (RLS) enabled. No table ships without RLS policies.
- Users can only read/write their own rows in `typing_results` and `profiles`. Leaderboard reads are public; writes are not.
- Never hardcode Supabase keys, tokens, or passwords into source files. Only reference `process.env.*`.
- Never put a `service_role` key behind `NEXT_PUBLIC_`. If a task seems to require it, stop and ask — it likely means the task should be a server action instead.

## 5. Performance Rules

- No network request per keystroke. Typing state is 100% local until test completion.
- Leaderboard and profile stats queries must use proper indexes — flag if a query pattern needs one.
- Keep bundle size in mind: don't import an entire library for one function.

## 6. Error Handling

- Every Supabase call (client or server) must be wrapped and handle the error case — no unguarded `await supabase...` without a try/catch or `.then/.catch`.
- User-facing errors should be short, plain-language toasts (use existing `use-toast` hook), not raw error objects or stack traces shown in the UI.
- Never fail silently on a failed result submission — the user must know if their score wasn't saved.

## 7. Code Style

- TypeScript strict mode — no `any` unless truly unavoidable, and comment why if used.
- Functional components only, no class components.
- Pure calculation logic (WPM, accuracy) lives in `lib/`, not inline in components — must be independently testable.
- Reuse existing shadcn/ui components before creating new custom UI primitives.
- Keep components focused — if a component file is doing typing logic AND rendering AND data fetching, split it.

## 8. Design Consistency

- Follow Design.md for all colors, fonts, spacing, and the neubrutalist visual style already established. Do not introduce a different design language mid-project.
- Dark/light theme must both be supported for any new UI — don't ship a component that only works in one theme.

## 9. Git & File Hygiene

- Never commit `.env` or `.env.local` files.
- Never paste real Supabase keys, passwords, or tokens into commit messages, comments, or documentation files.
- Keep commits scoped to one phase/feature at a time — don't mix unrelated changes.

## 10. When Unsure

- If a requirement is ambiguous, ask before building rather than guessing and building the wrong thing.
- If a request would break a rule above, say so explicitly instead of quietly complying.
- Update Memory.md after completing meaningful work (see Memory.md instructions).
