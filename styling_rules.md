# Queso Ventures — Landing Page Styling Rules

These rules apply to every mock. Non-negotiable unless Emmanuel explicitly overrides one.

## Typography

- Section H2: `font-size: 1.9rem` (desktop), `1.5rem` (mobile). Fixed rem only — NO vw-based sizes.
- Hero/display title: `2.4rem–2.6rem` max.
- Price/stat displays: `2.2rem` — same scale as section headings, NOT a full-screen element.
- Location hours / key data: `2rem` max.
- Body copy: `1rem` (Domine or equivalent serif).
- Small meta / labels: `0.88rem–0.92rem` monospace (Courier Prime).
- Every headline must fit on ONE LINE at 1440px viewport width with 6vw padding. If it wraps, shrink the font.

**Banned:** `clamp(Xrem, Yvw, Zrem)` for any heading or stat. `font-size` in `vw` units. `max-width` on headlines.

## Layout

- `text-align: center` on ALL sections.
- Section padding: `7rem 6vw` (desktop), `5.5rem 5vw` (mobile `@media (max-width: 768px)`).
- "Full width" means sections extend edge-to-edge with proportional padding — NOT a tight `max-width` boxing content in.
- NO `max-width` on section containers or headlines.
- Body copy only: `max-width: 52ch; margin: 0 auto` for readability.
- Single-column stack. No multi-column editorial layouts unless explicitly requested.
- Dark/light alternation for rhythm (cream → dark → cream → dark).

## ABSOLUTE PROHIBITIONS

**NO eyebrow labels. Ever.**
An eyebrow label is any small tracked all-caps text sitting above a heading — e.g., "COFFEE MEMBERSHIP" above "Join the Club", or "OUR STORY" above the about heading. They look template-ish and add clutter. If a distinction needs communicating, put it in the heading itself: "Atascocita Café" not a label "CAFÉ" above "Our Location".

Detection pattern: `letter-spacing > 0.15em + text-transform: uppercase + font-size < 0.9rem` immediately before an `<h2>` — that's an eyebrow. Remove it.

**NO vw-based font sizes.**
**NO max-width on headlines.**
**NO triple brand name instances** — the nav carries the name as text, the hero may carry it once (h1 or logo image). Not both + a third.

## Hero Sections

- Full-bleed photo: `position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%`.
- Dark overlay: `rgba(20, 4, 4, 0.48)` on top of the image (z-index above image, below content).
- Hero content: centered both axes — `display: flex; flex-direction: column; align-items: center; justify-content: center`.
- Hero section height: `100vh`.
- Hero text: white, title `2.4rem–2.6rem`, subtitle `1rem–1.1rem`.
- No logo image floating inside the hero if the brand name already appears as the h1 title.

## Gallery

- 4-column CSS Grid, `gap: 4px`, `aspect-ratio: 1`, `object-fit: cover`.
- 12 slots total. Fill real photos first, numbered placeholders for the rest.
- Placeholder: `background: #2a2a2a; display: flex; align-items: center; justify-content: center; color: #444; font-size: 0.8rem`.
- Mobile: 2 columns.

## CTAs / Buttons

- Primary CTA: bold, high-contrast, centered.
- Buttons centered with `display: flex; justify-content: center`.

## NAP & Schema

- Every page must include Name, Address, Phone in visible footer text.
- JSON-LD `LocalBusiness` schema injected in `<head>`.

## Preferred Fonts

- Display/headings: **Chivo** weight 900
- Body: **Domine**
- Mono accent: **Courier Prime**
- Load via Google Fonts `<link>` in `<head>`.
