# TheJury — Features & roadmap

A human-readable overview of what's shipped and planned. The canonical, votable
version is the public roadmap board (`roadmap_items` → `/roadmap`), seeded from
`supabase/seed_roadmap.sql`; keep this file in step with that board.

**Positioning:** TheJury is polling and decision-making for **Australian
organisations** — churches & ministries, clubs & associations, councils &
government, businesses, and presenters. Copy, templates and pricing are built
around motions, elections, consultations and meetings, not casual/gaming polls.

Legend: ✅ shipped · 🔨 in progress · 📋 planned

---

## 🌐 Platform

### Shipped
- ✅ **Free / Organisation / Council & Enterprise plans** — Free to start; Organisation self-serve (A$9/mo or A$90/yr — placeholder, confirm before launch); Council & Enterprise is contact-sales / invoice-billed.
- ✅ **Five question types** — multiple choice, rating, ranked choice, image options, reactions.
- ✅ **Live results + CSV export** — results update live; export every response.
- ✅ **No-account voting** — vote from a link, QR code, or six-character code.
- ✅ **Public API** — create polls and read results with an API key (`docs/api.md`).
- ✅ **Public roadmap board** — guest + user voting, user suggestions, admin view, user roles.
- ✅ **Server-side plan enforcement** — Free/Org/Council limits checked on the server, not just hidden in the UI.
- ✅ **Five audience pages** — `/for/{churches,clubs-and-associations,councils-and-government,businesses,presenters}`.
- ✅ **Org poll templates** — governance (AGM motion, committee/board election, congregational vote, board circular resolution), consultation (rule-change, community consultation), feedback (anonymous staff, client/patient satisfaction), dates & events (find a meeting date), live sessions (session check-in, training topic).
- ✅ **Meeting-date → calendar invite** on the results page (`.ics` + Google) for date polls.
- ✅ **GA4 analytics**, Terms + Privacy, OG/Twitter image, robots/sitemap/SEO metadata.

### In progress
- 🔨 **Results record (PDF)** — a downloadable PDF (question, options, eligible voters, counts, open/close times) ready for the minutes.
- 🔨 **Verified voting** — one private link per member for elections and motions, one vote each.

### Planned
- 📋 **Server-enforced anonymous voting** — guarantee a response can't be linked back to a voter.
- 📋 **Organisation accounts with multiple admins** — one org account, several admins.
- 📋 **Invoice billing** — pay by invoice on the Council & Enterprise plan.
- 📋 **Reminders before a poll closes** — nudge members who haven't voted yet.
- 📋 **Meeting-date polls with calendar invite** — extend date polls end-to-end (API + reminders).

---

## 🤖 Discord bot

The bot is **still live but no longer marketed** — kept as a shipped capability
for linked servers, not a headline feature of the org positioning.

- ✅ Create & run polls from a linked Discord server (`/jury create`, `schedule`, `results`, `link`, `close`/`reopen`), live counts, one-vote integrity, top.gg autopost.

No further bot work is planned unless the org direction calls for it.

---

## ⚙️ Under the hood (recent)

Performance work that's positioning-neutral and already shipped:
- Cut redundant/serialised queries on the results & answer pages (reused loaded questions, parallel fetches).
- Debounced realtime refresh so vote bursts don't re-run the query chain per vote per viewer.
- Lazy-loaded the QR and AI-generate modals; direct question-type imports keep editor-only code out of voter bundles.
- Added `demo_votes(demo_poll_id, voter_fingerprint)` index for the homepage live-poll tally + dedup.

---

## Launch checklist (user side)

- ✅ Base schema up to date via `supabase/apply_pending.sql` (roadmap, discord tables, vote-uniqueness, demo indexes).
- 📋 Run `supabase/seed_roadmap.sql` to load the org roadmap board, and `supabase/seed_demo_polls.sql` for the hero demo poll.
- 📋 Confirm AU pricing and create the matching Stripe prices; set `STRIPE_PRO_PRICE_ID` / `_ANNUAL_` (+ Council billing).
- 📋 Deploy web (and the bot, if kept running).
