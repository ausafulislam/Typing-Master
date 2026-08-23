# AGENTS.md

Instructions for any AI coding agent (v0, Claude Code, Cursor, etc.) working on TypeMaster X.

---

## 1. Before You Start

Read these files, in this order, before writing any code:

1. `PRD.md` — what we're building and for whom
2. `Architecture.md` — tech stack, folder structure, data/auth flow
3. `Rules.md` — hard boundaries (allowed libraries, security, error handling)
4. `Phases.md` — current phase and what's in/out of scope right now
5. `Design.md` — colors, fonts, spacing, component style
6. `Memory.md` — what's already been built and what's next (if it exists yet)

Only build what the **current phase** in `Phases.md` asks for. Do not pull in features from later phases even if they seem quick to add.

---

## 2. Git Commit Workflow

### 2.1 Verify Git Credentials

Before any commit, check the configured identity:

```bash
git config --global user.name
git config --global user.email
```

### 2.2 Correct Credentials

These must match exactly:

- `user.name` → `ausafulislam`
- `user.email` → `ausafdev@gmail.com`

If missing or incorrect, set them:

```bash
git config --global user.name "ausafulislam"
git config --global user.email "ausafdev@gmail.com"
```

Do not commit under any other identity, even temporarily.

### 2.3 Stage and Commit

- Stage only files relevant to the current task. Don't bundle unrelated changes into one commit.
- Write clear, present-tense commit messages (e.g. `Add OAuth login flow`, not `fixed stuff`).
- Never commit `.env`, `.env.local`, or any file containing real API keys, tokens, or passwords.
- Never paste real secrets into commit messages or code comments.

### 2.4 Version Management

Update the version in `package.json` following [Semantic Versioning](https://semver.org/) before committing:

| Bump | When |
|---|---|
| **Patch** (`0.1.x`) | Bug fixes, typo corrections, minor style tweaks |
| **Minor** (`0.x.0`) | New features, new game modes, UI enhancements |
| **Major** (`x.0.0`) | Breaking changes, database schema changes, API rewrites |

Check the current version in `package.json` and bump it appropriately as part of the same commit as the change.

---

## 3. During Development

- Follow the tech stack and restrictions in `Rules.md` exactly — no new libraries, state managers, or auth methods without checking there first.
- Follow `Design.md` for any UI work — neubrutalist style, blue as the only primary/accent color, dark and light theme both supported.
- Server-side must always recompute WPM/accuracy from raw data; never trust a client-submitted score.
- All new Supabase tables need Row Level Security policies before they ship.
- If a request conflicts with `PRD.md`, `Rules.md`, or the current phase in `Phases.md`, say so instead of silently building it.

---

## 4. After Meaningful Work

Update `Memory.md` with:

- What was built or changed
- Any deviation from the plan, and why
- The next immediate task

Keep entries short. `Memory.md` exists so a new session or a different agent can pick up context without re-reading the whole codebase.

---

## 5. When Unsure

Ask before guessing. It's cheaper to clarify scope, a library choice, or a design detail up front than to build the wrong thing and redo it.