# Queso Ventures — AI Mock Generator PRD
**Version:** 0.2  
**Owner:** Emmanuel Mendieta  
**Status:** Desktop phase active — iPad phase planned

---

## Vision

Two entry points into the same mock generation system:

**Desktop (now):** Emmanuel creates a client folder, drops in `brief.json` + assets, and types one Claude Code command. Claude Code handles the rest — research, reference scanning, build, QA — and writes `index.html` directly. No API key, no extra cost, already on the Pro plan.

**iPad / field (later):** A web app at `leads.quesoventures.com` where Emmanuel fills out a 2-minute intake form on-site, uploads photos, and gets a live shareable URL before leaving the parking lot. This phase requires the Anthropic API and a Next.js app. The Claude Code command files from the desktop phase become the API agent prompts — no rework.

---

## How the Desktop Phase Works

```
1. mkdir foodTrucks/newClient
2. cp _template/brief.json foodTrucks/newClient/brief.json  → fill it in
3. Drop logo.jpg, hero.webp, photo1..N into the folder
4. Open Claude Code from repo root
5. /build-mock foodTrucks/newClient
6. Claude Code reads brief, scans published mocks, generates index.html, updates TOC
7. Preview locally → if good, commit → live on GitHub Pages
```

No API key. Uses existing Claude Pro plan. Emmanuel can course-correct mid-generation if needed.

---

## Intake Brief (`brief.json`)

Every client folder gets one. Fields:

| Field | Notes |
|---|---|
| `businessName` | Used in copy and directory slug |
| `cityNeighborhood` | Used in SEO copy and location section |
| `businessType` | Drives which command variant fires + which examples get referenced |
| `primaryServiceHook` | One line — e.g. "taco catering" or "coffee membership" |
| `posLink` | Embedded as primary CTA button |
| `anythingSpecial` | Free field — hours, market schedule, age gate, etc. |
| `nap` | Address(es) + phone — required for SEO schema |

Template at `_template/brief.json`.

---

## Claude Code Command Files

Stored in `.claude/commands/`. These are the core of the system.

### `/build-mock <slug>`
The main command. When invoked:
1. Reads `[slug]/brief.json`
2. Detects available assets (logo, hero, photos, menu)
3. Scans published mocks in the repo — **same business type first** — and uses up to 2 as quality references (their HTML is passed directly; text tokens, not screenshots)
4. Reads `styling_rules.md` and `inspirations.json`
5. Generates complete `index.html` and writes it to the client folder
6. Updates root `index.html` TOC (new entries only)

### `/qa-mock <slug>`
Lightweight check after generation. Flags:
- Eyebrow labels (tracked all-caps before an h2)
- Any `font-size` over `3rem` outside the hero
- Missing H1 or H2s
- CTA button with no real href
- Missing NAP text
- No JSON-LD schema

Reports pass ✅ or a list of issues to fix.

### Industry Variants (planned)

Each variant extends `/build-mock` with category-specific section structure and SEO copy patterns:

| Command | Industry | Key sections | Primary CTA |
|---|---|---|---|
| `/build-mock-food-truck` | Food trucks | Hero, catering CTA, gallery, about, location/schedule, booking form | Book catering |
| `/build-mock-smoke-shop` | Smoke shops | Hero, product categories, age note, location/hours, deals | Visit us / order online |
| `/build-mock-bar` | Bars | Hero, hours/events, food menu, about, location | Visit us |
| `/build-mock-coffee` | Coffee shops | Hero, membership/offer, gallery, menu, locations | Join the club / order |
| `/build-mock-barber` | Barber shops | Hero, services + pricing, gallery, booking, location | Book appointment |
| `/build-mock-med-spa` | Med spas | Hero, services, before/after gallery, about, booking | Book consultation |

Base `/build-mock` works for any type. Variants add tighter section structure and industry-specific defaults.

**Build order:** nail food trucks → smoke shops → then the rest.

---

## Styling Rules

`styling_rules.md` in repo root. Injected verbatim into every build command. Single source of truth.

Key rules (full list in the file):
- Section H2: `1.9rem` fixed. Never vw-based.
- No eyebrow labels. Ever.
- `text-align: center` on all sections
- `padding: 7rem 6vw` per section — full width means edge-to-edge, not tight `max-width`
- Price/stat displays same scale as headings (~`2.2rem`)
- Full-bleed hero: `object-fit: cover`, centered content both axes
- 12-slot gallery (real photos first, numbered placeholders for the rest)
- Preferred fonts: Chivo 900 (display), Domine (body), Courier Prime (mono)

---

## Inspiration List

`inspirations.json` in repo root. Emmanuel maintains this manually. Structure:

```json
{
  "coffee": [
    { "name": "Blank Street Coffee", "url": "https://www.blankstreet.com" },
    { "name": "Onyx Coffee Lab", "url": "https://onyxcoffeelab.com" }
  ],
  "food_truck": [...],
  "bar": [
    { "name": "Kirby Icehouse", "url": "https://kirbyicehouse.com" }
  ]
}
```

The Research Agent (desktop: Claude Code with WebFetch; iPad: API agent) fetches 2 URLs from the matching category and extracts design signals.

---

## Quality Reference System

Every committed `index.html` in the repo is treated as an approved reference. No separate folder, no screenshots, no manual tagging. Committed = approved.

When `/build-mock` runs, it scans all published mocks, picks up to 2 (same business type first), and passes their HTML as text to the build step. Claude reads the actual CSS patterns, section structure, and typography decisions — not a visual approximation.

**As you add approved mocks, the quality bar automatically rises.**

---

## Delivery & Storage (Desktop Phase)

- Generated `index.html` written directly to `[slug]/`
- Commit and push manually → live on GitHub Pages within ~60 seconds
- Root `index.html` TOC updated automatically by the command
- No archiving in desktop phase — git history is the archive

---

## iPad Phase (Phase 3 — future)

When the desktop command quality is consistent and the vertical playbooks are solid, we build the web app. The command files become the API agent system prompts — copy the content, wrap in a Next.js API route.

### Tech Stack (iPad phase)
| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) |
| API / Orchestration | Next.js API routes + Anthropic SDK |
| Model | claude-sonnet-4-6 |
| File uploads | Client-side base64 → API |
| Mock storage | GitHub API push to leads repo |
| Cache | Browser localStorage |
| Auth | Secret token in URL (iPad home screen bookmark) |
| Hosting | Vercel → CNAME `leads.quesoventures.com` (Cloudflare DNS) |

### iPad User Flow
```
1. Open leads.quesoventures.com?key=SECRET on iPad
2. Fill intake form (2 min) — mirrors brief.json fields + file uploads
3. Watch live progress: Research → Asset Analysis → Design → Build → QA
4. Preview mock in full-screen iframe
5. Share URL with client OR regenerate
6. Auto-pushed to GitHub Pages, live in ~60 seconds
```

---

## Build Phases

### Phase 1 — Desktop Command Files (current)
- [x] `styling_rules.md` — codified rules
- [x] `inspirations.json` — per-category reference sites
- [x] `_template/brief.json` — intake template
- [x] `generate.js` — API script scaffold (will become iPad phase backend)
- [ ] `.claude/commands/build-mock.md` — core generation command
- [ ] `.claude/commands/qa-mock.md` — QA check command
- [ ] Test on 3+ real leads (food trucks first)

### Phase 2 — Industry Variants (desktop)
- [ ] `/build-mock-food-truck` — nail the food truck vertical
- [ ] `/build-mock-smoke-shop` — nail smoke shops
- [ ] Add industry variants as needed based on real leads
- [ ] Refine `inspirations.json` with entries that produce strong references

### Phase 3 — iPad Web App
- [ ] Next.js app scaffold + Vercel deploy
- [ ] Intake form UI (mirrors brief.json + file upload)
- [ ] API routes — port command file content into agent system prompts
- [ ] Progress UI (live step indicators)
- [ ] Preview iframe + Share / Regenerate toolbar
- [ ] localStorage cache per client slug
- [ ] Secret token auth + iPad home screen optimization
- [ ] CNAME `leads.quesoventures.com` → Vercel (Cloudflare DNS)

### Phase 4 — Polish (stretch)
- [ ] Archive browser (list past mocks, restore any version)
- [ ] GitHub API auto-push on generation
- [ ] `contenteditable` tap-to-edit mode on preview
- [ ] Webhook: auto-update TOC when new mock is pushed

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Desktop tool | Claude Code slash commands | Already on Pro plan, no API key needed, can course-correct |
| Quality signal | Published HTML files (text) | Cheaper than screenshots, more precise, zero maintenance |
| Industry build order | Food trucks → smoke shops → rest | Most leads in those verticals; nail quality before expanding |
| API approach | Saved for iPad phase | Required for web app; command files become the prompts |
| Model | claude-sonnet-4-6 | Best quality/cost for generation tasks |
| Hosting (mocks) | GitHub Pages (existing) | Already set up, no change needed |
| Hosting (iPad app) | Vercel | CNAME to quesoventures.com via Cloudflare |
| Domain registrar | Cloudflare | Easy CNAME, already owns quesoventures.com |
| Photo handling (desktop) | Local files, relative paths in HTML | No upload needed, files already in folder |
| Photo handling (iPad) | base64 in API call | No S3 needed for MVP |
| Business types | food_truck, coffee, bar, barber, med_spa, smoke_shop, dentist, donuts | Emmanuel's confirmed list |
