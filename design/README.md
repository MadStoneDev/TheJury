# Handoff: TheJury marketing + app redesign

## Overview
A redesign of ten routes of **TheJury** (thejury.app), an Australian-hosted polling and voting tool for organisations: the marketing homepage, five use-case landing pages (churches, clubs & associations, councils & government, businesses, presenters), pricing, the logged-in dashboard, auth (login/signup) and the templates gallery. Each route is designed at **desktop 1440px** and **mobile 375px**.

The redesign keeps the existing visual system (near-black navy, emerald accent, Outfit + a serif display face, subtle grid texture, 12px rounded cards with 1px low-contrast borders) and changes structure, density and content:

- Homepage gains a static hero, a "Who uses TheJury" section linking the five use-case pages, a compact 6-item feature grid, a "How it compares" strip, a two-tier pricing teaser and a real final CTA band. The old big-numbers stats band is gone.
- Five use-case pages share one template with a single muted accent colour each, one per audience.
- Pricing drops to two plans with max 8 feature lines per card, no crossed-out lines on Free, and a collapsed compare-all table.
- The dashboard's four stat cards collapse into one slim strip; poll rows get three visible actions plus an overflow menu; a zero-poll empty state is included.
- Auth replaces the empty left panel with a live poll card.
- Templates swaps emoji for line icons in tinted emerald squares.

## About the Design Files
The files in `design-files/` are **design references written in HTML** — prototypes that show the intended look and behaviour. They are **not production code to copy**. They use a small in-house streaming-component runtime (`support.js`, `<x-dc>`, `{{ }}` holes, `<sc-for>`, `<sc-if>`) that exists only in the design tool; none of that should reach your codebase.

The task is to **recreate these designs in the target codebase's existing environment** (React/Next, Vue, etc.) using its established component library, routing, styling approach and state patterns. If no environment exists yet, pick the framework that suits the project and build there.

Each HTML file contains **two or three frames side by side** (desktop, mobile, and sometimes a state variant). They are laid out on a canvas for review — the frames are the same page at different viewports, not separate pages. Real implementation should be **one responsive page per route**, with the mobile frame describing the sub-768px layout and the desktop frame the ≥1024px layout. A sensible tablet interpolation is at your discretion.

All copy in the files is final copy unless the product team says otherwise. All data (poll titles, vote counts, names, dates) is sample data.

## Fidelity
**High fidelity.** Colours, typography, spacing, radii and copy are final and should be matched. Recreate pixel-accurately using the codebase's existing libraries where they can produce the same result; where the codebase has an equivalent primitive (button, card, pill/badge, menu), use it and restyle to these tokens rather than introducing a parallel system.

---

## Design Tokens

### Colour
| Token | Value | Use |
|---|---|---|
| `bg/base` | `#0B0F19` | Page background |
| `bg/alt` | `#0A0E17` | Alternating section background (max two backgrounds per page) |
| `bg/surface` | `#0F1520` | Cards, inputs' container, panels |
| `bg/input` | `#0B0F19` | Inputs, poll option rows inside a card |
| `bg/menu` | `#141B27` | Overflow/dropdown menu surface |
| `bg/canvas` | `#06080D` | Review canvas only — not part of the product |
| `border/default` | `rgba(255,255,255,0.07)` | 1px card and control borders |
| `border/subtle` | `rgba(255,255,255,0.05)` | Section dividers, nav/footer rules |
| `border/strong` | `rgba(255,255,255,0.12–0.14)` | Secondary buttons, action buttons |
| `accent/emerald` | `#10B981` | Primary accent, primary buttons, active nav |
| `accent/emerald-hi` | `#34D399` | Accent text on dark, link hover |
| `accent/on-emerald` | `#04180F` | Text/icon on an emerald fill |
| `accent/emerald-tint` | `rgba(16,185,129,0.12)` | Icon squares, badge fills |
| `accent/emerald-line` | `rgba(16,185,129,0.30–0.45)` | Highlighted card border, badge border |
| `text/primary` | `#F8FAFC` | Headings, key values |
| `text/body` | `#E2E8F0` | Feature lines, list body |
| `text/muted` | `#94A3B8` | Body copy, secondary labels |
| `text/dim` | `#64748B` | Meta, captions, placeholders |
| `text/faint` | `#475569` | Copyright, ghost labels |
| `danger` | `#F87171` | Delete menu item |

**Per-page muted accent** — exactly one per use-case page, never mixed:
| Page | Accent | Tint | Text-on-fill |
|---|---|---|---|
| `/for/churches` | `#E0B384` | `rgba(224,179,132,0.10–0.16)` | `#160F0A` |
| `/for/clubs-and-associations` | `#8FB0E8` | `rgba(143,176,232,0.10–0.16)` | `#0B0F19` |
| `/for/councils-and-government` | `#7FBEB5` | `rgba(127,190,181,0.10–0.16)` | `#08110F` |
| `/for/businesses` | `#A79BEA` | `rgba(167,155,234,0.10–0.16)` | `#12101F` |
| `/for/presenters` | `#E79AAE` | `rgba(231,154,174,0.10–0.16)` | `#1A0D12` |

Lighter text variants used on tinted chips: `#EFCEA8` (churches), `#B3CAF0` (clubs), `#AAD8D0` (councils), `#C4BBF3` (businesses), `#F1BECC` (presenters).

### Typography
Two families, loaded from Google Fonts:
- **Outfit** — all UI and body. Weights 300 / 400 / 500 / 600 / 700.
- **Playfair Display** — display serif for headlines, the wordmark and large price figures. Weights 600 / 700 / 800. *(This stands in for the existing serif display face; if the production site already ships a different serif, keep that one and match the sizes below.)*

Desktop scale:
| Role | Spec |
|---|---|
| Hero H1 | Playfair 700, 62–68px, line-height 1.08–1.1, letter-spacing −0.01em |
| Page H1 (pricing/templates) | Playfair 700, 48–54px |
| Section H2 | Playfair 700, 34–36px |
| CTA band H2 | Playfair 700, 42px |
| Card title | Outfit 600, 17–20px |
| Eyebrow / section kicker | Outfit 700, 12px, letter-spacing 0.14em, uppercase, accent colour |
| Step label | Outfit 700, 13px, letter-spacing 0.12em, emerald |
| Lead paragraph | Outfit 300, 19–20px, line-height 1.6 |
| Body | Outfit 300, 15–17px, line-height 1.55–1.65 |
| Feature line | Outfit 400, 15px |
| Meta / caption | Outfit 300, 12–14px |
| Badge / pill | Outfit 600, 10–13px, letter-spacing 0.05–0.08em |
| Price figure | Playfair 700, 40–46px |
| Code / monospace | `ui-monospace, monospace`, 12–13px |

Mobile scale (375): hero H1 36–38px, section H2 26px, page H1 32–34px, card title 16–17px, body 14–15px, meta 11–12px, eyebrow 11px. Nothing below 11px; tap targets ≥44px.

Body copy uses `text-wrap: pretty` on hero and lead paragraphs.

### Spacing
Desktop section padding `72px 56px` (hero `80–88px` top, CTA band `78px`); nav `22px 56px`; footer `38px 56px`. Card padding 24–34px. Grid gaps: cards 20–24px, two-column feature rows 64–72px. Mobile: section padding `36–40px 20px`, card padding 18–22px, gaps 10–14px.

### Radii, borders, shadows
- Cards, frames, panels: **12px** (page frame in the mocks is 16px — that's the review frame, not the product).
- Buttons and pills: **999px** (fully round). Form fields and action buttons: **10px** / **9px**.
- Icon squares: 10px (42×42 desktop, 36–38px mobile).
- Inner poll option rows: 10px; embedded/preview rows 8px.
- All borders 1px.
- Card elevation: `0 30px 70px -30px rgba(0,0,0,.9)`.
- Highlighted (Organisation / popular) card: `0 0 0 1px rgba(16,185,129,.1), 0 30px 70px -34px rgba(16,185,129,.55)` with a `rgba(16,185,129,.45)` border.
- CTA band wash: `radial-gradient(700px 240px at 50% 0%, <accent 10%>, transparent 70%)` (mobile `400px 180px`).

### Grid texture
Applied to hero and full-page marketing backgrounds:
```css
background-image:
  linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
background-size: 48px 48px; /* 40px on mobile */
```
The auth page uses an emerald-tinted variant: `rgba(16,185,129,.05)` on `#07110F`.

---

## Screens / Views

### 1. `/` Homepage — `design-files/Homepage.dc.html`
**Purpose:** convert a visitor into a first poll.

Order of sections:
1. **Nav** — wordmark left; Pricing / Templates / Use cases / Docs centre (Outfit 400 15px, `text/muted`); Sign in + emerald "Get started" pill right. Bottom border `border/subtle`.
2. **Hero** — two columns, `1fr 480px`, gap 72px, vertically centred, on grid texture. Left: emerald outline eyebrow pill ("Australian-hosted · No account needed to vote"), static H1 "Polls and votes your organisation can actually use" (no rotating-word effect); lead paragraph (max-width 520px); two buttons — emerald "Create a poll", outlined "See a live poll" (anchors to the poll card). Right: **live poll card** (see Components).
3. **Who uses TheJury** — H2 + one-line sub, then 5 cards. Each: 42px tinted icon square in that audience's secondary colour, title (600/19px), one concrete scenario, coloured text link "For X →". Cards link to the five use-case routes.
4. **How it works** — on `bg/alt`. Three columns, each with a 1px left rule, `STEP 01/02/03` emerald label, 20px title, body.
5. **Features** — exactly 6 cards, 3×2, emerald-tinted 38px icon squares, 17px title, two-line body: Australian hosting, anonymous or verified voting, results record, live results, private polls, works on any phone.
6. **Comparison strip** — H2 "How it compares", a table comparing TheJury with Google Forms and Mentimeter/Slido. The TheJury column is filled; competitor cells show italic "Check" until verified.
7. **Pricing teaser** — on `bg/alt`. H2 + sub left, "Compare all features →" link right; two cards (Free, Organisation highlighted with MOST POPULAR pill). No lifetime option.
8. **Final CTA band** — radial emerald wash, H2 "Put it to a vote", one sentence, single emerald button. Must not be an empty band.
9. **Footer** — wordmark, link columns (including the five use cases and Security), "Australian owned and operated · ABN" line with the RAVENCI credit, copyright.

Mobile: single column; nav collapses to wordmark + Get started + hamburger (with a "Use cases" group listing the five audiences); hero buttons full-width stacked; poll card below the copy; "Who uses TheJury" and pricing stack; features become a 2×3 grid with 14px titles.

### 2. Use-case page template — `/for/churches`, `/for/clubs-and-associations`, `/for/councils-and-government`, `/for/businesses`, `/for/presenters`
One template, five instances. Structure:

1. Nav (same as homepage, "Use cases" active).
2. **Hero** — `1fr 500px`; accent-coloured eyebrow pill; H1 62px; lead; two buttons (primary CTA differs per page); a poll card on the right themed in that page's accent.
3. **Four alternating feature sections** — `1fr 1fr`, gap 64px, alternating image side and alternating `bg/base` / `bg/alt`. Each has an eyebrow in the accent colour, a 36px Playfair H2, body, and a 3-item check list (16px check icon in the accent colour).
4. **Pricing teaser** (identical to homepage; sub-line and Organisation description are page-specific).
5. **Final CTA band** with a radial wash in the page's accent.
6. Footer.

**a. `/for/churches`** — accent `#E0B384`. Hero "Put it to the congregation."; visual is a verified congregational vote (adopt the building extension proposal, Yes/No/Abstain). Sections: *Congregational votes* (a "Members on the roll" card listing who has voted and who has a link outstanding), *Service times & dates* (a multi-select mid-week-night poll), *Honest feedback* (an anonymous ministry-team support poll), *In the room* (a live youth-group poll). CTAs: "Create a poll" + "How your data is handled".

**b. `/for/clubs-and-associations`** — accent `#8FB0E8`. Hero "Online voting for your AGM."; visual is a verified AGM motion (adopt the amended constitution, For/Against/Abstain). Sections: *AGM motions* (a second motion result card), *Committee elections* (a ranked candidate ballot, choose up to 3), *Member consultation* (an anonymous rule-change poll), *Dates & events* (a multi-select working-bee date poll). CTA: "Create a poll".

**c. `/for/councils-and-government`** — accent `#7FBEB5`. Hero "Ask the community. Keep the data here."; visual is a consultation poll embedded in a browser-chrome mock of the council website. Sections: *Community consultation* (the same embedded poll), *Workshops & town halls* (a live planning-workshop poll), *Internal staff feedback* (an anonymous staff pulse check), *One account, many admins* (a departments-running-polls breakdown). CTAs: "Create a poll" + "How your data is handled" / "Talk to us about pricing".

**d. `/for/businesses`** — accent `#A79BEA`. Hero "Ask the hard questions. Keep the answers here."; visual is an anonymous staff-support poll. Sections: *Staff feedback* (an anonymous agree/disagree workload poll), *Client & patient satisfaction* (a front-desk 1–5 rating card), *Partner & board decisions* (a verified premises-lease vote), *Dates & logistics* (a multi-select offsite-date poll). CTA: "Create a poll".

**e. `/for/presenters`** — accent `#E79AAE`. Hero "Poll the room while you talk."; visual is an on-screen six-character join code. Sections: *A code on screen* (a live workshop poll), *In your slides* (a poll embedded in a deck), *Read the room* (a live session check-in), *A local option* (a poll on where sessions run, positioning TheJury as the smaller Australian alternative to Mentimeter/Slido). CTAs: "Create a poll" + "See pricing".

### 3. `/pricing` — `design-files/Pricing.dc.html`
Centred H1 "Simple, **transparent** pricing" (the middle word emerald) + lead. Two control groups centred below: **Monthly | Annual (Save 17%)** and **A$ AUD | $ USD | € EUR**, both as pill segmented controls (4px padding track, active segment = emerald fill with `#04180F` text).

Three cards in a max-6xl `1fr 1fr 1fr` grid:
- **Free** — `A$0` + "forever", one-line description, feature lines with emerald ticks, outlined "Get started free".
- **Organisation** — highlighted: emerald border, emerald glow shadow, `MOST POPULAR` pill overlapping the top-left corner (`top:-13px; left:34px`). Price in emerald with `/mo` or `/yr`. No lifetime option. Feature lines, emerald "Choose Organisation".
- **Council & Enterprise** — "From A$79/mo", invoice-billing note, feature lines, outlined "Talk to us" (mailto, not a checkout).

Below: a **collapsed "Compare all features"** card (title + "Every limit and feature, line by line" + chevron that rotates 180° on open, 0.18s). Expanded it reveals a table with columns Feature / Free / Organisation / Council & Enterprise, header in 13px 0.06em uppercase, Organisation column emerald, 1px row separators. Footnote: "Prices shown in AUD. Cancel any time. Your polls stay live on the free tier."

Prices: Organisation AUD 9/mo, 90/yr. Council & Enterprise from AUD 79/mo, 790/yr (invoice available). Annual sub-line: "Billed yearly."; monthly: "Billed monthly."

Mobile: controls stack (currency control shows symbols only), cards stack with Organisation first; compare table scrolls horizontally at 13px.

### 4. `/dashboard` — `design-files/Dashboard.dc.html`
**App nav:** wordmark, Pricing / Templates / **Dashboard** (emerald, active) / Create Poll, then a theme toggle icon and a 32px emerald avatar.

**Header row:** H1 "Your polls" + sub, and an emerald "＋ Create new poll" pill on the right.

**Slim stats strip** (replaces the four stat cards): a single 12px card, `16px 24px` padding, four inline `value + label` pairs (`4 polls · 2 active (emerald) · 19 votes · 5 avg per poll`) separated by 1px 26px-tall dividers, with "Last vote 2 hours ago" pushed right in `text/dim`.

**Filter row:** search field (flex 1) + "All statuses" and "Newest" dropdown chips.

**Poll row** (12px card, `20px 24px`, 12px gap between rows):
- Left block: title (600/18px) · **status pill** (Active = emerald text/tint/border; Closed = grey) · **question-type tag** (11px, grey, 6px radius). Second line in 13px `text/dim`: `Code` + a monospace code chip, `N votes`, `Created <date>`.
- Right block: three visible actions — **Share**, **Results**, **Edit** — as 9px-radius outlined buttons with a 15px line icon and 13px label; then a square (38×36) "…" button.
- The "…" opens a 220px menu (`#141B27`, 1px border, 12px radius, 6px padding, heavy shadow) anchored `top:64px; right:24px`, containing: View voting page, Embed code, Duplicate, Close/Reopen voting (label depends on status), divider, **Delete poll** in `#F87171`. Only one menu open at a time; clicking the same "…" closes it.

**Empty state** (new user, zero polls): a dashed-border panel with a faint emerald radial wash — 52px emerald icon square, H2 "No polls yet", one sentence, "Create your first poll" (emerald) + "Start from a template" (outlined), and three starter-template cards below. Shown in the file as separate 1000px and 375px frames.

Mobile poll row: title + "…" on the first line, pills on the second, meta wrapped on the third, and the three actions as an equal 3-column button row.

### 5. `/auth/login` and `/auth/signup` — `design-files/Login.dc.html`
Two equal columns, full viewport height (900px in the mock).

**Left panel** (replaces the previously empty panel): background `#07110F` with the emerald grid texture, `56px` padding, space-between — wordmark top, then a **live poll card** (max-width 420px, the standard card with 4 result rows, leader at 100%) and **one line of copy** beneath it in Outfit 300 18px `text/muted`:
- login: "This is a real poll someone settled in four minutes — yours takes about the same."
- signup: "Five active polls, unlimited votes, no card — that's the free tier, forever."
Bottom: copyright.

**Right panel** — the existing form, unchanged: 420px card, Playfair H1 ("Login" / "Create your account"), sub, labelled fields (`#0B0F19`, 1px border, 10px radius, `13px 15px`), "Forgot your password?" aligned right of the Password label, full-width emerald submit (10px radius), and the switch link underneath.

Mobile: left panel becomes a top block (wordmark, poll card, the line of copy) above the form card.

### 6. `/templates` — `design-files/Templates.dc.html`
Centred H1 "Poll templates" + lead; a centred row of category pills (All active in emerald; Feedback, Education, Events, Team, Marketing, Fun outlined). 3-column card grid, 20px gaps, cards min-height 210px.

**Card:** top row = a **42px emerald-tinted square holding a 20px Lucide-style line icon** (stroke `#10B981`, width 1.8, round caps/joins) — this replaces the old emoji — and, on gated templates, the badge group on the right: a `PRO` (emerald) 10px/0.08em badge on gated templates, plus a small grey padlock. Each card also shows its audience tag. Then title (600/18px), description, and a footer row with the question count (`text/dim`) and the CTA: free templates get an emerald "Sign in to use"; gated ones get an outlined "Unlock" with a lock icon.

Twelve templates, icons in order: smile, utensils, calendar, check-circle, bar-chart, trending-up, graduation-cap, mic, tag, briefcase, refresh, search. Mobile: single column, 38px icon squares, badge without the padlock.

---

## Interactions & Behavior
- **Hero word rotation** (homepage): `setInterval` 1800ms cycling four words; each swap fades in and rises 6px over 0.4s. Pause it under `prefers-reduced-motion`.
- **Pricing billing toggle**: switches Organisation's price between monthly and annual and swaps the description line. Free stays at 0.
- **Currency switcher**: AUD / USD / EUR changes every price on the page and the footnote.
- **Compare all features**: click the header row to expand/collapse; chevron rotates 180° over 0.18s. Collapsed by default.
- **Dashboard overflow menu**: click to open, click again or click another row's "…" to close. Should also close on outside click and `Esc` in production, and be keyboard-navigable.
- **Hover states** (not captured in the static mocks — implement to the codebase's conventions): primary emerald buttons lighten to `#34D399`; outlined buttons raise their border to `rgba(255,255,255,.24)`; cards raise border to `rgba(255,255,255,.12)`; links go `#10B981 → #34D399`.
- **Responsive**: the 375 frame is the small-screen layout; the 1440 frame is the large one. Marketing sections go single-column below ~900px; the dashboard's stats strip becomes a four-up compact row; poll-row actions become a 3-up grid.
- **Loading / error states** are not designed here — reuse the codebase's existing patterns, styled with these tokens.

## State Management
Minimal and all local:
- Homepage: `rotatingWordIndex` (interval-driven).
- Pricing: `billing: 'monthly' | 'annual'`, `currency: 'AUD' | 'USD' | 'EUR'`, `compareOpen: boolean`. Currency would sensibly persist per user/locale in production.
- Dashboard: `openMenuId: string | null`; poll list, stats and filter/sort/search state come from the API.
- Auth: standard form state; the left-panel poll card is presentational (a real poll's data could be fetched, but static sample data is fine).
- Templates: `activeCategory` filter; gating comes from the user's plan.

## Assets
No image, video or binary assets are used — every visual is CSS or inline SVG.
- **Icons**: hand-inlined **Lucide-style** line icons (24×24 viewBox, `fill:none`, `stroke:currentColor`-equivalent, stroke-width 1.8–2.4, round caps and joins). Replace them with the real **lucide** package in your codebase; names used: calendar, users, zap, bar-chart, clock, code, lock, sparkles/settings, download, check, chevron-down, search, share-2, edit-3/pencil, eye, copy, toggle-left, trash, more-horizontal, plus, sun, menu, smile, utensils, check-circle, trending-up, graduation-cap, mic, tag, briefcase, refresh-cw.
- **Fonts**: Outfit and Playfair Display from Google Fonts. If the production site already uses a different serif display face, keep it.
## Files
In `design-files/` (open any of them directly in a browser):
| File | Routes |
|---|---|
| `Homepage.dc.html` | `/` (desktop + mobile) |
| `ForChurches.dc.html` | `/for/churches` |
| `ForClubsAndAssociations.dc.html` | `/for/clubs-and-associations` |
| `ForCouncilsAndGovernment.dc.html` | `/for/councils-and-government` |
| `ForBusinesses.dc.html` | `/for/businesses` |
| `ForPresenters.dc.html` | `/for/presenters` |
| `Pricing.dc.html` | `/pricing` |
| `Dashboard.dc.html` | `/dashboard` (list + empty state) |
| `Login.dc.html` | `/auth/login`, `/auth/signup` |
| `Templates.dc.html` | `/templates` |
| `support.js` | design-tool runtime — **do not port** |

PNG renders of every frame, named by route, are in the project's `exports/` folder (not bundled here by default — ask if you want them included).
