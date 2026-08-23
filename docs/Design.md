# TypeMaster X — Design.md

Design language: **Neubrutalism** — bold borders, high contrast, raw/blocky shapes, minimal decoration. Function over ornamentation. This matches the existing brutalist landing page already live.

---

## 1. Core Visual Principles

- Thick, visible borders (2-4px solid) instead of soft shadows
- Hard-edged corners or minimal border-radius (0-4px), not fully rounded
- High contrast between background and foreground — no muted, washed-out tones
- Flat colors, no gradients
- Bold, chunky typography for headings
- Offset "hard shadow" style (solid color shadow, not blurred) on cards/buttons for depth
- Generous whitespace to let the bold elements breathe

---

## 2. Color Palette

### Dark Theme (default)
| Role | Color | Hex |
|---|---|---|
| Background | Near-black | `#0A0A0A` |
| Surface / Card | Dark gray | `#141414` |
| Border | Off-white | `#F5F5F5` |
| Primary text | White | `#FAFAFA` |
| Secondary text | Muted gray | `#A3A3A3` |
| Accent (primary action) | Blue | `#3B82F6` |
| Accent (hover/active) | Darker blue | `#2563EB` |
| Success / correct char | Green | `#22C55E` |
| Error / incorrect char | Red | `#EF4444` |

### Light Theme
| Role | Color | Hex |
|---|---|---|
| Background | Off-white | `#F0F3F6` |
| Surface / Card | White | `#FFFFFF` |
| Border | Near-black | `#0A0A0A` |
| Primary text | Near-black | `#0A0A0A` |
| Secondary text | Dark gray | `#525252` |
| Accent (primary action) | Blue | `#2563EB` |
| Accent (hover/active) | Darker blue | `#1D4ED8` |
| Success / correct char | Green | `#16A34A` |
| Error / incorrect char | Red | `#DC2626` |

Blue is the **only** primary/accent color across the whole product — no secondary accent color (yellow, etc.). Green and red are reserved strictly for correct/incorrect typing feedback, not used as general UI accents. Accent stays blue across both themes for brand consistency; only background/surface/text/border flip between dark and light.

Adjust these exact hex values to match whatever is already live on the deployed site — this table is the starting reference, not a hard override of existing choices.

---

## 3. Typography

- **Headings:** A bold, geometric sans-serif (e.g. `Space Grotesk`, `Inter` at 700-800 weight, or `Archivo Black` for hero text)
- **Body:** `Inter` or `Geist Sans`, 400-500 weight, for readability
- **Typing test text:** A monospace font is required for the typing area itself — e.g. `JetBrains Mono`, `Geist Mono`, or `IBM Plex Mono` — so character width is consistent and cursor alignment is precise

| Use | Font | Weight | Size (base) |
|---|---|---|---|
| Hero heading | Space Grotesk / Archivo Black | 800 | 3rem-4rem |
| Section heading | Space Grotesk | 700 | 1.5rem-2rem |
| Body text | Inter | 400-500 | 1rem |
| Stats numbers (WPM, etc.) | Space Grotesk or monospace | 700 | 2rem-3rem |
| Typing test text | JetBrains Mono / Geist Mono | 500 | 1.25rem-1.5rem |
| Labels / captions | Inter | 500 | 0.75rem-0.875rem, uppercase, letter-spaced |

---

## 4. Spacing & Layout

- Base spacing unit: 4px (Tailwind default scale — use `4, 8, 12, 16, 24, 32, 48, 64`)
- Cards/sections use consistent padding: `p-6` to `p-8` on desktop, `p-4` on mobile
- Max content width: `1200px` centered, with side padding on smaller viewports
- Grid gaps: `gap-4` to `gap-6` between cards/stats blocks

---

## 5. Components Style Guide

### Buttons
- Solid fill (accent color) with thick border in contrasting color
- Hard offset shadow (e.g. `4px 4px 0px #000`), shifts to `2px 2px 0px` on active/press for a "pressed button" tactile effect
- No border-radius or minimal (`rounded-sm`, 2-4px)
- Bold, uppercase or title-case label text

### Cards (stats, leaderboard rows, result screen)
- Thick border matching theme border color
- Flat background (Surface color), no gradient
- Hard shadow offset, consistent direction (e.g. always bottom-right)

### Inputs / Typing Area
- Monospace font, generous letter-spacing
- Current character: highlighted background (accent color, high contrast)
- Correct characters: default/muted text color or green tint
- Incorrect characters: red text or red underline, never silently ignored visually

### Leaderboard Table
- Alternating row treatment via border, not background shading (stay true to brutalist flat style)
- Rank column visually emphasized (bold, larger) for top 3

### Badges / Tags (version tag, "Live" indicator, achievement badges)
- Small, bordered, flat-color chip
- Uppercase text, letter-spaced, small font size

---

## 6. Theme Switching

- Support Dark / Light / System
- Toggle stored client-side (not tied to auth) so guests can also switch
- Both themes must maintain the same neubrutalist contrast rules — light theme is not just "dark theme colors inverted with softness added," borders and shadows stay hard-edged in both

---

## 7. Motion / Interaction

- Keep animation minimal and snappy — instant, not eased/floaty, to match the brutalist "raw" feel
- Button press: shadow offset reduces instantly (no easing curve, or very short linear transition ~80-100ms)
- Typing cursor: solid blinking block, not a thin line, for visibility
- Avoid decorative animations (parallax, fade-ins on scroll) — they conflict with the minimal/functional aesthetic

---

## 8. Accessibility Notes

- Maintain WCAG AA contrast minimum even with bold color choices — verify accent-on-background combos
- Error/success colors (red/green) must not be the only signal — pair with icons or text where it matters (e.g. incorrect character also gets underline, not just color change) for colorblind users
- Ensure focus states are visible (thick outline matches border style, not a default thin browser outline)