# TheJury — Pre-Launch Test Plan

## 1. Authentication

- [ ] **Sign up** with email + password — verify email confirmation arrives
- [ ] **Sign up** with duplicate email — should show error
- [ ] **Sign up** with duplicate username — should show "taken"
- [ ] **Sign up** with short username (< 3 chars) — should reject
- [ ] **Login** with valid credentials — redirects to `/dashboard`
- [ ] **Login** with wrong password — shows error
- [ ] **Forgot password** — sends reset email, link works
- [ ] **Update password** from reset link — succeeds, redirects to dashboard
- [ ] **Unauthenticated access** to `/dashboard`, `/create`, `/profile`, `/edit/*` — all redirect to `/auth/login`
- [ ] **Unauthenticated access** to `/answer/*`, `/embed/*`, `/results/*`, `/pricing`, `/templates` — all work without login

## 2. Profile

- [ ] **View profile** — shows username, email, member since, poll count, tier badge
- [ ] **Change username** — type new name, blur field, see availability check, save — persists on refresh
- [ ] **Change username** to taken name — shows "taken" error, save button disabled
- [ ] **Subscription section** — shows correct tier (Free/Pro/Team)
- [ ] **Manage Billing** button (Pro/Team) — opens Stripe billing portal
- [ ] **Upgrade button** (Free) — links to `/pricing`

## 3. Poll Creation

- [ ] **Create basic poll** — single question, 2-4 options, save — appears on dashboard
- [ ] **Create multi-question poll** — add 2+ questions, each with options — all save correctly
- [ ] **Free tier: 2 question limit** — "Add Question" shows upgrade modal after 2
- [ ] **Free tier: 5 active poll limit** — creating 6th active poll blocked with upgrade prompt
- [ ] **Question types** (Pro/Team):
  - [ ] Multiple choice — standard options
  - [ ] Rating scale — configure min/max, labels
  - [ ] Ranked choice — drag-to-rank options
  - [ ] Image choice — upload images for each option
  - [ ] Open-ended (Team) — text input, no options
  - [ ] Reaction poll (Team) — emoji grid
- [ ] **Free tier question type lock** — non-MC types show lock icon + upgrade modal
- [ ] **Poll settings**:
  - [ ] Description field saves
  - [ ] "Allow multiple selections" toggle works
  - [ ] "Show results to voters" toggle works
  - [ ] Scheduling (Pro/Team) — set start/end date, free tier shows lock
  - [ ] Password protection (Pro/Team) — set password, free tier shows lock
- [ ] **A/B testing** (Team) — create variants, set traffic split
- [ ] **Generate with AI** — opens modal, enter prompt, preview poll, "Use This Poll" populates form
- [ ] **AI free tier limit** — 3/month, shows count, blocks at limit
- [ ] **Use template** — visit `/templates`, click "Use Template", form pre-populated

## 4. Poll Editing

- [ ] **Edit poll** from dashboard — loads existing data correctly
- [ ] **Change question text** — saves on submit
- [ ] **Add/remove options** — persists
- [ ] **Add/remove questions** — persists
- [ ] **Toggle active/inactive** — updates immediately

## 5. Voting (Answer Page)

- [ ] **Vote on single-question poll** — select option, submit, see confirmation
- [ ] **Vote on multi-question poll** — step through questions, submit all at once
- [ ] **Anonymous voting** — vote without being logged in (fingerprint-based)
- [ ] **Duplicate vote prevention** — voting again on same poll shows "already voted"
- [ ] **Inactive poll** — shows "This poll is no longer active"
- [ ] **Scheduled poll (not started)** — shows "This poll opens in X days"
- [ ] **Password-protected poll** — shows password gate, correct password reveals poll
- [ ] **Each question type voting**:
  - [ ] Multiple choice — select option(s), submit
  - [ ] Rating scale — click stars/numbers, submit — results show average
  - [ ] Ranked choice — drag to reorder, submit — results show rankings
  - [ ] Image choice — click image, submit
  - [ ] Open-ended — type text, submit — appears in results
  - [ ] Reaction — click emoji(s), submit
- [ ] **Live mode** — when presenter is active, page shows LIVE badge
- [ ] **Live mode: results hidden** — shows "Waiting for presenter..." overlay
- [ ] **Live mode: poll closed** — shows "Poll closed by presenter"

## 6. Results

- [ ] **Dashboard results page** — shows vote counts, percentages for all questions
- [ ] **Chart selector** (Pro/Team) — switch between bar, pie, donut
- [ ] **Free tier** — bar chart only, pie/donut show lock
- [ ] **Public results page** (`/results/[code]`) — only accessible if `show_results_to_voters` is on
- [ ] **Public results page** — blocked if `show_results_to_voters` is off
- [ ] **Real-time updates** — open results in one tab, vote in another — results update automatically
- [ ] **CSV export** (Pro/Team):
  - [ ] Multiple choice — downloads with option names + vote counts
  - [ ] Rating scale — downloads with average, distribution
  - [ ] Ranked choice — downloads with avg position, first-place counts
  - [ ] Open-ended — downloads with all text responses
- [ ] **CSV export** (Free) — shows upgrade modal
- [ ] **Analytics dashboard** (Team) — shows votes/day, peak hour, time heatmap, day-of-week chart
- [ ] **A/B test results** (Team) — side-by-side variant comparison

## 7. Embed

- [ ] **Copy embed code** from dashboard — paste in HTML page — poll renders in iframe
- [ ] **Vote via embed** — submit vote, see confirmation
- [ ] **Multi-question in embed** — pagination dots, step through questions
- [ ] **Password gate in embed** — shows compact password form
- [ ] **Branding** — free tier shows "Powered by TheJury", Pro/Team does not
- [ ] **Custom logo** (Team) — shows uploaded logo instead of branding
- [ ] **Embed theme** (Pro/Team) — custom colors, font, border radius applied
- [ ] **Real-time in embed** — votes from other sources update embed results

## 8. Presenter Mode (Pro/Team)

- [ ] **Access** — click "Present" on dashboard, opens fullscreen dark view
- [ ] **Free tier blocked** — shows upgrade prompt
- [ ] **Non-owner blocked** — shows error
- [ ] **QR code** — displays correct `/answer/[code]` URL, scannable
- [ ] **Live vote counter** — animates as votes arrive
- [ ] **Real-time bar chart** — bars grow as votes come in
- [ ] **Controls bar** — appears on mouse move, auto-hides after 3s
- [ ] **Hide/show results** — toggle works, answer page responds
- [ ] **Multi-question navigation** — prev/next buttons work
- [ ] **Close poll** — marks poll inactive, answer page shows "closed"
- [ ] **Fullscreen toggle** — enters/exits browser fullscreen
- [ ] **Connection indicator** — shows wifi icon (green = connected)
- [ ] **Cleanup** — leaving presenter page disables live mode on the poll

## 9. Dashboard

- [ ] **Poll list** — shows all user's polls with question, status, vote count, date
- [ ] **Search** — filters by question text
- [ ] **Status filter** — All / Active / Inactive
- [ ] **Sort** — Newest / Oldest / Most Votes / Least Votes
- [ ] **Pagination** — 10 per page, next/prev work
- [ ] **Actions per poll**:
  - [ ] Edit — goes to `/edit/[code]`
  - [ ] Delete — confirmation dialog, removes poll
  - [ ] Duplicate — creates copy with "(Copy)" suffix, inactive
  - [ ] Duplicate image poll — images preserved
  - [ ] Share — modal with URL, QR code (Pro/Team), social links
  - [ ] Results — goes to results page
  - [ ] Present (Pro/Team) — goes to presenter mode
  - [ ] View — goes to answer page
  - [ ] Embed code — shows copyable embed snippet
- [ ] **Active poll count** — shows "X/5 active" for free tier
- [ ] **Schedule badges** — "Starts in Xd" (blue), "Ends in Xd" (amber), "Ended" (gray)
- [ ] **Checkout success** — visiting `/dashboard?checkout=success` shows welcome toast

## 10. Stripe / Billing

- [ ] **Pricing page** — shows Free / Pro / Team cards with correct prices
- [ ] **Monthly/Annual toggle** — prices update, "Save X%" badge appears
- [ ] **Subscribe to Pro** — Stripe checkout opens, complete payment — profile shows Pro
- [ ] **Subscribe to Team** — same flow, profile shows Team
- [ ] **Webhook: subscription created** — profile updated with tier, status, period end
- [ ] **Webhook: subscription updated** (plan change) — tier updates
- [ ] **Webhook: subscription deleted** (cancellation) — reverts to free
- [ ] **Webhook: invoice.paid** — status confirmed as active
- [ ] **Webhook: invoice.payment_failed** — status set to past_due
- [ ] **Manage Billing** — opens Stripe portal, can cancel/change plan
- [ ] **After cancellation** — features revert to free tier limits
- [ ] **Feature gating after downgrade** — Pro/Team features show lock icons

## 11. Team Workspace (Team tier)

- [ ] **Create team** — enter name, submit — team created, user is owner
- [ ] **Team dashboard** — shows member list, team polls
- [ ] **Invite member** — enter email, send invite
- [ ] **Remove member** — owner/admin can remove
- [ ] **Team link in navbar** — only visible for Team tier users

## 12. API & Integrations (Team tier)

- [ ] **Generate API key** — key shown once, prefix visible in list
- [ ] **API: GET /api/v1/polls** — returns user's polls with API key auth
- [ ] **API: POST /api/v1/polls** — creates poll via API
- [ ] **API: GET /api/v1/polls/[id]** — returns poll with results
- [ ] **Revoke API key** — key no longer works
- [ ] **Create webhook** — set URL + events, saves
- [ ] **Toggle webhook** — enable/disable
- [ ] **Delete webhook** — removes from list
- [ ] **Custom domain setup** — enter domain, shows DNS TXT record to add

## 13. Templates

- [ ] **Templates page** loads — shows template gallery
- [ ] **Category filter** — clicking category pills filters templates
- [ ] **Free templates** — "Use Template" links to `/create?template=X`
- [ ] **Pro/Team templates** — show lock icon for lower tiers, upgrade prompt on click
- [ ] **Template pre-fill** — form populated with template question + options

## 14. Navigation & Layout

- [ ] **Navbar links** — all correct: Pricing, Templates, Dashboard, Create, Team (Team only), Profile
- [ ] **Mobile menu** — hamburger opens sheet drawer with all links
- [ ] **Theme toggle** — dark/light mode switches, persists
- [ ] **Footer** — renders on all pages, links work
- [ ] **Error boundaries** — visit invalid route — shows error page, not crash
- [ ] **Loading states** — skeleton loaders show on dashboard, results, profile, create

## 15. Cross-Browser & Responsive

- [ ] **Desktop** — Chrome, Firefox, Safari, Edge
- [ ] **Mobile** — iOS Safari, Android Chrome
- [ ] **Tablet** — iPad
- [ ] **Responsive breakpoints** — all pages usable at 320px, 768px, 1024px, 1440px

## 16. Security

- [ ] **Rate limiting** — rapid API calls get 429 after threshold
- [ ] **Seed endpoint** — requires `SEED_SECRET` header, rejects without it
- [ ] **Embed origin validation** — postMessage only accepted from valid origins
- [ ] **Embed theme injection** — invalid CSS colors/fonts rejected
- [ ] **Password hashing** — poll passwords stored as SHA-256 hash, not plaintext
- [ ] **API key hashing** — keys stored as SHA-256 hash
- [ ] **XSS** — poll questions/options with `<script>` tags are escaped in output
- [ ] **Webhook signatures** — invalid Stripe signatures return 400
