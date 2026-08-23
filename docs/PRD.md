# TypeMaster X — Product Requirements Document (PRD v2)

## 1. Product Overview

TypeMaster X is a typing practice, testing, and competitive platform inspired by products like Monkeytype.

Core principle:

> "Practice without friction. Create an account when you want to compete, track, and earn."

This version corrects scope from the original draft: the MVP is intentionally small, and advanced features (certificates, games, multiplayer) are pushed to later phases so the product can actually ship and be maintained by a solo/small team.

---

## 2. User Types

### Guest User
- Take typing tests, unlimited
- Select test duration
- View WPM, accuracy, results
- Basic customization (dark/light theme)
- No account required

### Registered User (OAuth only)
- Save results permanently
- Appear on the leaderboard
- Track typing history and stats
- Earn achievements
- Public profile

**No email/password auth.** Only OAuth providers: **Google** and **GitHub**.

---

## 3. Core User Flow

```
Visitor
  ↓
Start Typing Test (no login required)
  ↓
Complete Test → View Result
  ↓
Practice Again  OR  Save / Compete
  ↓
Login with Google/GitHub (only if saving)
  ↓
Result saved → Leaderboard → Stats
```

The user is never forced to log in before typing.

---

## 4. Homepage

**Hero:** "Master Your Typing"
**Subtext:** "Test your speed, improve your accuracy, and compete with typists around the world."
**Primary CTA:** Start Typing
**Secondary CTA:** Leaderboard

Sections: Typing Test, Leaderboard, How It Works. Keep it minimal — no games/achievements sections until those features exist.

---

## 5. Typing Test

**Durations (MVP):** 15s / 30s / 60s
**Modes (MVP):** Time-based only. Words/Quotes/Custom text → Phase 2.

**Real-time metrics during test:**
- WPM, Accuracy, Errors, Timer, Progress

Typing input is handled fully client-side (local state). No API calls per keystroke — only one submission at test end.

---

## 6. Result Screen

Display: WPM, Accuracy, Errors, Characters typed, Duration.

Actions:
- Try Again
- Share Result (copy link)
- Save Result (triggers OAuth login if guest)

Guest prompt example:
> "Sign in with Google or GitHub to save your result and join the leaderboard."

---

## 7. Authentication (OAuth only)

Provider: Supabase Auth
Methods: **Google OAuth**, **GitHub OAuth**
Email/password: **disabled**

Setup steps:
1. Supabase Dashboard → Authentication → Providers → enable Google, enable GitHub
2. Disable Email provider
3. Create OAuth apps in Google Cloud Console and GitHub Developer Settings, add Supabase redirect URI to both
4. Client call:
```ts
await supabase.auth.signInWithOAuth({ provider: 'google' })
await supabase.auth.signInWithOAuth({ provider: 'github' })
```

Auth is requested only at the point of saving a result — never before.

---

## 8. Database Structure (Supabase)

MVP tables only:

```
profiles
  id (uuid, references auth.users)
  username
  avatar_url
  created_at

typing_results
  id
  user_id (references profiles.id)
  wpm
  accuracy
  errors
  duration
  created_at

leaderboard_entries (view or query on typing_results)
  ranks by wpm desc, accuracy desc
```

Achievements, certificates, games tables are **not built in MVP** — added in later phases once the schema need is proven.

---

## 9. Leaderboard

- Account-based only (guest results are local/session-only, never on public leaderboard)
- Filters: All-time, Weekly (MVP). Daily/Monthly → later.
- Duration filter: 15s / 30s / 60s
- Row: Rank | Username | WPM | Accuracy | Date

**Legacy data:** existing name-based leaderboard entries are kept, tagged "Legacy", and excluded from the new account-based rankings.

---

## 10. Anti-Cheat (basic, MVP-level)

- Client sends raw keystroke timestamps + typed text, not just a final WPM number
- Server recalculates WPM and accuracy from the raw data before storing
- Rate limit: max 3 submissions per user per minute
- Reject results with impossible WPM (e.g. > 250 WPM) pending manual review flag

Full fraud-detection heuristics are a later-phase concern.

---

## 11. User Profile & Stats (MVP-level)

Profile shows: username, avatar, best WPM, average WPM, best accuracy, tests completed.

Stats page: simple list/table of recent tests. WPM-over-time chart is Phase 2 (not MVP) — use Recharts once history data exists.

---

## 12. Customization (MVP)

- Dark / Light / System theme

Everything else (fonts, caret styles, sound toggle polish, multiple color themes) → Phase 2+.

---

## 13. What Is Explicitly Out of MVP Scope

To keep this shippable, the following are **deferred**, not deleted from the vision:

- Certificates + verification system
- Achievements/badges
- Typing games (Race, Word Rush, Time Attack, Survival)
- Multiplayer / tournaments
- Word/Quote/Custom text modes
- SEO landing pages
- Multiple languages
- Advanced analytics events

These stay in the long-term roadmap (Section 15) but are not built until the MVP is live and has real users.

---

## 14. Non-Functional Requirements

- No API call per keystroke — instant local feedback
- Fast page load, minimal input latency
- Responsive UI (desktop-first, mobile-usable)
- Supabase RLS: users can only read/write their own `typing_results` and `profiles` rows; leaderboard is public-read only
- No unnecessary personal data collection

---

## 15. Roadmap

**Phase 1 — MVP (this document's scope)**
Guest typing, OAuth login, account-based leaderboard, basic profile/stats, anti-cheat basics, dark/light theme.

**Phase 2 — Depth**
Word/Quote/Custom modes, WPM-over-time charts, streaks, more themes, weekly/monthly leaderboard resets.

**Phase 3 — Recognition**
Achievements/badges, shareable result cards.

**Phase 4 — Certificates**
Certificate generation + public verification page, once there's enough active user trust to make it meaningful.

**Phase 5 — Games & Social**
Typing Race, Word Rush, Time Attack, Survival, friend challenges.

**Phase 6 — Scale**
Multiplayer, tournaments, seasonal leaderboards, multi-language support, SEO landing pages.

---

## 16. Final Product Vision

> "Visit → start typing instantly → practice → improve → sign in with Google or GitHub when you want to save, compete, and track progress."

Core loop: Practice → Test → Save → Compete → Come Back and Improve.

Signup is optional for typing. An account (Google/GitHub only) is required for identity, competition, and history.
