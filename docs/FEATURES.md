# TheJury — Features & roadmap

A living reference of everything shipped and planned across the **Discord bot** and the
**web platform**, grouped by surface. The canonical, votable version lives on the public
roadmap board (`roadmap_items` table → `/roadmap`); this file is the human-readable
overview that sits next to the code.

Legend: ✅ shipped · 🔨 in progress · 📋 planned

---

## 🤖 Discord bot

### Shipped
- ✅ **`/jury create`** — modal form: question, options (one per line), *allow multiple?*, *auto-close after*. Gaming placeholders.
- ✅ **`/jury schedule`** — proposes the next 4 Fridays (or custom dates) and stores real dates for the calendar invite.
- ✅ **`/jury results <code>`** — ephemeral results snapshot + link.
- ✅ **`/jury link`** — connect a server to a TheJury account (15-min code flow).
- ✅ **`/jury close` / `/jury reopen`** — stop/restart voting; edits the message into a closed state.
- ✅ **Live vote counts** in the message, with a "View full results" link.
- ✅ **One vote per user** — enforced by a DB unique index, with graceful race handling (23505 = already counted).
- ✅ **Pro upgrade nudge** — auto-close is gated to Pro; Free posts without a deadline + a prompt.
- ✅ **Scheduling → calendar invite** — the winning night becomes an `.ics` / Google Calendar link.
- ✅ **top.gg autopost** — server-count updates.
- ✅ **`bot_installed` analytics** — GA4 Measurement Protocol on guild join.

### Next up
- 📋 **Ranked-choice & rating polls** (`/jury rank`, `/jury rate`) — bring the web vote methods to Discord.
- 📋 **Announce the winner on close** — post the result and @ the winning option.
- 📋 **Live countdown** in the embed ("closes in 3h").
- 📋 **Add-your-own-option button** — voters suggest options instead of the host pre-listing them all.

### Later
- 📋 Recurring polls (auto-post a weekly game night).
- 📋 Reminders / ping non-voters before close.
- 📋 Role-restricted voting (limit a poll to a Discord role).
- 📋 Quorum / minimum votes to be valid.
- 📋 Auto-thread for discussion on a poll.
- 📋 DM the winner / a result summary on close.

---

## 🌐 Web platform

### Shipped
- ✅ **Marketing redesign** — homepage, three `/for` use-case pages, pricing, dashboard, auth panel, templates.
- ✅ **Two-tier pricing** — Free + Pro (monthly / annual / one-off lifetime).
- ✅ **Server-side tier enforcement** — poll create/update/CSV/embed run through server actions, not just hidden UI.
- ✅ **Public API** — create scheduling polls & read results with a per-user API key (`docs/api.md`).
- ✅ **Public roadmap board** — guest + user voting, user suggestions, admin modal, user roles.
- ✅ **Gaming poll templates** — Game Night, Session Scheduling, Rate the Session, Next Campaign.
- ✅ **Calendar invite on results** — `.ics` + Google Calendar for the winning date.
- ✅ **GA4 analytics** — poll_created, poll_shared, vote_cast, upgrade_clicked, bot_installed.
- ✅ **Terms + Privacy**, OG/Twitter image, robots/sitemap/JSON-LD SEO, `/link-discord`.

### Next up
- 📋 **Tournament bracket & seeding polls** — a gaming-specific poll type that seeds a bracket from the votes (links Discord ↔ web).
- 📋 **Trending / community polls** page — discovery + SEO.
- 📋 **Poll-closed & threshold notifications** — email or Discord DM.
- 📋 **More gaming templates** — LFG / availability, "who's in".

### Later
- 📋 Stream overlay for creators (the `/for/creators` mock made real).
- 📋 Calendar invites for API-created scheduling polls too.
- 📋 Webhooks for poll events (create / vote / close).
- 📋 Richer anonymous / results-hiding controls.
- 📋 Admin "mark suggestion read / archive" (the `is_read` column already exists; UI pending).

---

## 🔧 Cross-cutting / ops

Internal — not on the public roadmap board.

- 📋 Coolify "watch paths" so a bot-only push doesn't rebuild the web app (and vice versa).
- 📋 Docker log rotation + Coolify auto-cleanup (prevents the disk-full repeat).
- 📋 Move Docker's data off the near-full disk / use the spare 50G as swap or build cache.

---

## Launch checklist (user side)

- ✅ Run `supabase/apply_pending.sql` (roadmap, discord tables, vote unique indexes) — verified applied.
- ✅ Regenerate `database.types.ts` (`npx supatypes`).
- 📋 Create real Stripe prices **A$9/mo · A$90/yr · A$199 lifetime** and set `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_ANNUAL_PRICE_ID` / `STRIPE_PRO_LIFETIME_PRICE_ID`.
- 📋 Deploy web + bot (separate Coolify resources; bot base dir `apps/discord-bot`).
- 📋 top.gg listing.
