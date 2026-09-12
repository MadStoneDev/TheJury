# Lighthouse

## Running it

Lighthouse needs a real Chrome, so run it on your machine (or CI), not in the
sandbox:

```bash
npm run build          # LHCI serves the production build
npm run lighthouse     # npx @lhci/cli autorun — builds a server, runs LH, writes .lighthouse/
```

`lighthouserc.json` runs desktop audits against the marketing routes (`/`,
`/pricing`, `/templates`, `/for/*`) and warns if any category drops below the
thresholds (perf 0.8, a11y/best-practices/SEO 0.9). Reports land in
`.lighthouse/` (gitignored). Point it at other URLs by editing `collect.url`.

Don't audit `/dashboard`, `/edit`, `/profile`, `/create` — they're auth-gated
and `robots.ts` excludes them from indexing.

## Static review done in this pass (no headless browser available here)

Applied:
- `app/robots.ts` — allow public routes, disallow app/auth/api routes; link the sitemap.
- Per-page `<title>`/description/canonical on `/`, `/pricing`, `/templates`
  (previously inherited the generic root title). `/for/*` already had unique
  metadata + `SoftwareApplication` JSON-LD.
- Fonts load via `next/font` with `display: swap` (good CLS/LCP).
- No `<img>` in the redesign — visuals are CSS/inline SVG (no alt-text or
  unsized-image findings), and icon-only controls (dashboard "…", theme toggle)
  carry `aria-label`s.

Watch for when you run it:
- **Colour contrast** — the design's dimmest token (`text-jury-dim` #64748B on
  the near-black background) can sit near the 4.5:1 threshold for small meta
  text. It's a deliberate design choice; if Lighthouse flags it, nudge that
  token lighter for captions rather than repainting the palette.
- LCP on the homepage is the hero + live poll card (client component); it's
  light, but confirm on a throttled run.
