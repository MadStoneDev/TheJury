# TheJury - Product & Engineering Plan

## 1. Product Summary

TheJury is a web-based polling platform built with Next.js 15 (App Router), Supabase (PostgreSQL + Auth), Tailwind CSS, and shadcn/ui components. It allows users to create polls, share them via link or embed, and collect votes from both authenticated and anonymous users.

### Core Value Proposition
- Create polls in under 30 seconds
- Share via link or embeddable iframe
- Vote anonymously (no account required)
- Real-time results with percentage breakdowns

### Current State
- **Production URL**: thejury.app (deployed on Vercel)
- **Database**: Migrating from Supabase Cloud to self-hosted (Coolify)
- **Status**: Functional MVP with several incomplete features stubbed in the database

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Auth | Supabase Auth (email/password) |
| Database | PostgreSQL via Supabase |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Icons | Tabler Icons + Lucide React |
| Drag & Drop | @dnd-kit |
| Hosting | Vercel (frontend), Coolify (Supabase) |

### User Flow
```
Landing Page → Sign Up → Confirm Email → Dashboard → Create Poll
                                                        ↓
                                              Share Link / Embed
                                                        ↓
                                              Voters Vote (no login needed)
                                                        ↓
                                              Creator Views Results
```

---

## 2. UI Uplift & UX Fixes

### 2.1 Critical UX Issues

#### Navigation & Layout
- [ ] **Fixed footer overlaps content** — Footer uses `fixed bottom-0` which can cover page content. Switch to sticky or standard flow positioning.
- [ ] **Navbar has no dark mode support** — Hardcoded `bg-white`. Should use `bg-background` for theme compatibility.
- [ ] **No breadcrumb or back navigation** — Users on results/edit pages have no clear way back without using browser back button.

#### Buttons & Interactions
- [ ] **Emerald hover states broken** — `bg-emerald-700 hover:bg-emerald-700` provides zero visual feedback on hover. Fix to `hover:bg-emerald-800`.
- [ ] **Delete confirmation UX inconsistent** — Dashboard has delete confirmation, results page has no delete option at all.
- [ ] **Too many action buttons per poll card** — 6-8 buttons per card on dashboard is overwhelming. Group into a dropdown/context menu.

#### Forms
- [ ] **No inline validation on poll creation** — Errors only show after submission attempt. Add real-time validation (e.g., minimum 2 options warning as user types).
- [ ] **Password requirements unclear** — Only "minimum 6 characters" shown as hint. No strength indicator.

#### Voting Experience
- [ ] **No confirmation before vote submission** — Single click submits. Add a confirm step or "undo" window for accidental clicks.
- [ ] **Expired poll shows unhelpful error** — "Voting has ended" with no context. Should show when it ended and display final results.
- [ ] **No option to view results without voting** — If `show_results_to_voters` is off, users see nothing until they vote.

### 2.2 Visual & Design Improvements

- [ ] **Dashboard stats cards** — Currently plain numbers. Add trend indicators (up/down arrows), mini sparkline charts.
- [ ] **Results visualisation** — Plain percentage bars. Consider adding pie/donut charts for visual variety.
- [ ] **Empty states need illustration** — Currently just emoji + text. Add proper SVG illustrations for empty dashboard, no votes, etc.
- [ ] **Poll card redesign** — Cards are dense with metadata. Simplify: question + vote count + status badge + overflow menu for actions.
- [ ] **Mobile dashboard** — Stats grid uses non-standard `xs` breakpoint. Fix to proper `sm:grid-cols-2 lg:grid-cols-4`.

### 2.3 Missing UX Patterns

- [ ] **No pagination on dashboard** — All polls loaded at once. Will break with 50+ polls.
- [ ] **No search/filter on dashboard** — Can't find polls by name, status, or date.
- [ ] **No toast notifications** — Copy-to-clipboard feedback is inline icon change. Use proper toast system (e.g., sonner).
- [ ] **No skeleton loaders** — Loading states use generic spinner. Replace with content-shaped skeleton loaders.
- [ ] **No keyboard shortcuts** — Power users can't quickly create polls or navigate.

### 2.4 Accessibility Gaps

- [ ] **Loading spinners lack `role="status"` and `aria-live`** — Screen readers don't announce loading states.
- [ ] **Drag handles need keyboard instructions** — Has `aria-label` but no visible keyboard hint.
- [ ] **Embed page has no dark mode** — Hardcoded `bg-white p-4`. Embedded polls on dark sites look jarring.

---

## 3. Security, Optimization & Fixes

### 3.1 Critical Security Issues (Fix Before Production)

#### CRIT-1: Unsafe postMessage in Embed
- **File**: `app/embed/[pollCode]/page.tsx:39`
- **Issue**: `window.parent.postMessage(..., "*")` — wildcard origin allows any parent frame to intercept messages.
- **Fix**: Replace `"*"` with specific origin. Add origin validation on incoming messages.

#### CRIT-2: Unauthenticated Seed Endpoint
- **File**: `app/api/live-polls/seed/route.ts`
- **Issue**: POST endpoint inserts demo polls with zero auth checks. Anyone can call it.
- **Fix**: Add admin role check or remove endpoint entirely (seed via SQL instead).

#### CRIT-3: No Rate Limiting on Voting
- **Files**: `app/api/live-polls/vote/route.ts`, `lib/supabaseHelpers.ts`
- **Issue**: No rate limiting anywhere. Attacker can spam thousands of votes per second with spoofed fingerprints.
- **Fix**: Implement server-side rate limiting (in-memory for MVP, Redis/Vercel KV for production). 10 votes/minute/IP.

#### CRIT-4: Client-Side IP Detection via External API
- **File**: `lib/supabaseHelpers.ts:611-620`
- **Issue**: Uses `fetch("https://api.ipify.org")` client-side. Unreliable, spoofable, leaks user IP to third party. Falls back to `"unknown"` allowing unlimited untracked votes.
- **Fix**: Get IP from server-side request headers (`x-forwarded-for`, `cf-connecting-ip`). Remove external API call entirely.

### 3.2 High Security Issues

#### HIGH-1: Weak Browser Fingerprinting
- **File**: `lib/supabaseHelpers.ts:624-675`
- **Issue**: Canvas fingerprint + user agent + screen size = easily spoofed. Only 32-bit hash output. Client-side generated, server accepts anything.
- **Fix**: Supplement with server-side IP rate limiting. Don't rely on fingerprint alone for duplicate detection.

#### HIGH-2: Missing Input Validation on API Routes
- **File**: `app/api/live-polls/vote/route.ts`
- **Issue**: No type validation, no length limits, no UUID format checks. `voter_fingerprint` could be a 10MB string.
- **Fix**: Add Zod schema validation on all API inputs.

#### HIGH-3: No CSRF Protection
- **Issue**: No CSRF tokens on state-changing operations. Forms submit directly to API endpoints.
- **Fix**: Implement CSRF tokens via middleware. Add `SameSite=Strict` on auth cookies.

#### HIGH-4: Missing Content Security Policy
- **Issue**: No CSP headers configured. XSS vectors if poll content contains malicious scripts.
- **Fix**: Add CSP headers in `next.config.ts` or middleware.

#### HIGH-5: Client-Side Only Authorization
- **File**: `components/PollForm.tsx:232-237`
- **Issue**: Poll ownership check is client-side only (`poll.user_id !== user.id`). Can be bypassed.
- **Fix**: RLS policies should enforce this server-side. Verify RLS policies are correctly configured on self-hosted instance.

### 3.3 Performance Issues

#### PERF-1: N+1 Database Query on Dashboard (Critical)
- **File**: `lib/supabaseHelpers.ts:315-360`
- **Issue**: `getUserPolls()` fetches all polls, then runs a separate vote count query per poll via `Promise.all`. 10 polls = 11 queries, 50 polls = 51 queries.
- **Fix**: Use Supabase's nested select to include vote count in single query, or create an RPC function with `LEFT JOIN` + `GROUP BY`.

#### PERF-2: No API Response Caching
- **Files**: All `/app/api/live-polls/**` routes
- **Issue**: Every request hits the database. 100 users loading homepage = 100 queries for the demo poll.
- **Fix**: Add `Cache-Control` headers. Demo poll results can be cached 10-60 seconds.

#### PERF-3: ResizeObserver Recreated on Every State Change
- **File**: `app/embed/[pollCode]/page.tsx:35-49`
- **Issue**: Dependencies include `poll`, `hasVotedFlag`, `results` — observer is torn down and recreated on every vote/state change. Causes postMessage spam.
- **Fix**: Move to empty dependency array `[]`. Debounce resize messages.

#### PERF-4: Icon Library Bundle Size
- **Issue**: `@tabler/icons-react` (~700KB) + `lucide-react` (~100KB) imported. Even with tree-shaking, two icon libraries is wasteful.
- **Fix**: Consolidate to one icon library. Verify tree-shaking is working (named imports only).

### 3.4 Code Quality

- [ ] **Remove 16+ console.log/error calls** — Replace with structured logging (pino or similar) or remove entirely.
- [ ] **Remove dead/commented-out code** — `PollDashboardPage.tsx:72-81`, `PollForm.tsx:462-466`. Use git history instead.
- [ ] **Standardize error handling** — Some functions throw, some return `false`. Pick one pattern (recommend: always throw, catch at boundary).
- [ ] **Add Error Boundaries** — No React error boundaries. Any component crash kills the entire page.
- [ ] **Add environment variable validation** — Fail fast at startup if required env vars are missing.
- [ ] **Fix TypeScript loose types** — Unsafe `as string` casts in `supabaseHelpers.ts`. Use type guards instead.

---

## 4. Features Roadmap

### 4.1 Necessary (Broken/Missing Core Functionality)

These are gaps in the current product that users will notice and be frustrated by:

- [ ] **User profile page** — Profiles are auto-created but there's no page to view or edit them. No way to change username or avatar.
- [ ] **Poll results auto-refresh** — Results are static after loading. Poll creator has to manually refresh to see new votes.
- [ ] **Dashboard pagination & search** — No way to manage polls at scale. Breaks with 50+ polls.
- [ ] **Proper error pages** — Generic error handling. Need dedicated 404, 500, and auth error pages with recovery actions.
- [ ] **Email system** — Auth emails (verification, password reset) require SMTP. Setting up Resend for this. No transactional emails beyond auth currently.

### 4.2 Must-Haves (Expected by Users)

Features users of any polling tool expect:

- [ ] **Results export** — Download poll results as CSV or JSON. Currently no export capability.
- [ ] **Poll sharing options** — Currently just copy-link. Add QR code generation, social sharing buttons (X/Twitter, WhatsApp, email).
- [ ] **Duplicate/template polls** — No way to copy an existing poll as a starting point.
- [ ] **Poll closing/archiving** — Can toggle active/inactive but no concept of "closed" vs "archived". Old polls clutter the dashboard.
- [ ] **View-only results link** — Currently only the creator can see the results page. Need a shareable results URL.
- [ ] **Multi-poll types** — Only "select option(s)" exists. Add: yes/no, rating scale (1-5 stars), open text response, ranked choice.
- [ ] **Image/media in options** — Poll options are text-only. Allow image uploads for visual polls.

### 4.3 Nice-to-Haves (Differentiators)

Features that would set TheJury apart:

- [ ] **Complete the A/B testing system** — Database schema is fully built (`ab_experiments`, `poll_variants`, `user_variant_assignments`). Zero UI exists. This could be a killer feature for product teams.
- [ ] **Complete the gamification system** — Database schema exists (`achievement_types`, `user_achievements`, `user_stats`). Could drive engagement with badges, streaks, leaderboards.
- [ ] **Complete vote editing** — Database ready (`vote_edits`, `allow_vote_editing`). Let voters change their mind within a window.
- [ ] **Real-time live results** — Use Supabase Realtime subscriptions for WebSocket-powered live vote counting. Great for live events.
- [ ] **Presentation mode** — Full-screen results display for meetings/events (like Mentimeter). Show results animating in real-time.
- [ ] **Poll scheduling & recurring polls** — Schedule polls to go live at a future time. Create weekly recurring polls.
- [ ] **Advanced analytics** — Response timing, voter demographics (if collected), geographic heatmaps, vote velocity charts.
- [ ] **Team/workspace support** — Shared poll management for organizations. Multiple admins per workspace.
- [ ] **Custom branding** — Let users customize poll colors, logo, and fonts. White-label embeds.
- [ ] **Webhook notifications** — Notify external services (Slack, Discord, email) when votes come in or thresholds are reached.
- [ ] **API access** — Public REST API for programmatic poll creation and results fetching. SDKs for common languages.
- [ ] **Poll templates gallery** — Pre-built poll templates for common use cases (team retros, event feedback, product surveys).
- [ ] **Conditional logic / branching** — Show different follow-up questions based on previous answers.
- [ ] **Passworded/private polls** — Require a password or invite link to access certain polls.

---

## 5. Monetization Opportunities

### 5.1 Current State
- Zero pricing, zero feature gates, zero revenue infrastructure
- Everything is free and unlimited

### 5.2 Recommended Pricing Model: Freemium + Embed Monetization

#### Free Tier
- Unlimited polls (keeps growth engine running)
- Up to 100 votes per poll
- Basic results (percentages + bar charts)
- Community support
- "Powered by TheJury" branding on embeds

#### Pro — $9/month
- Unlimited votes per poll
- Remove "Powered by TheJury" branding
- Results export (CSV, JSON, PDF)
- Custom embed styling (colors, fonts)
- Email notifications on new votes
- Poll scheduling & time limits
- Priority support
- QR code generation

#### Team — $29/month
- Everything in Pro
- Team workspace (up to 10 members)
- Shared poll management
- A/B testing (once built)
- Advanced analytics & charts
- API access (1,000 requests/month)
- Webhook notifications
- Custom branding on polls

#### Enterprise — Custom pricing
- Everything in Team
- Unlimited team members
- White-label solution
- Custom domain for embeds
- SSO (SAML/OAuth)
- Dedicated support
- SLA guarantee
- Bulk poll creation API
- On-premise deployment option

### 5.3 Revenue Drivers by Feature

| Feature | Tier | Estimated Value |
|---------|------|-----------------|
| Remove branding from embeds | Pro | High — bloggers/companies care about this |
| Results export (CSV/PDF) | Pro | Medium — researchers, educators need this |
| A/B testing | Team | High — product teams will pay for this |
| API access | Team | High — developers want programmatic access |
| Custom branding | Team | Medium — brand-conscious companies |
| Team workspace | Team | High — collaboration is a core need |
| White-label | Enterprise | Very High — agencies, SaaS platforms |
| Real-time presentation mode | Pro | Medium — event organizers, teachers |
| Advanced analytics | Team | Medium — data-driven teams |
| Webhook/integrations | Team | Medium — workflow automation |

### 5.4 Growth Levers

1. **Embed virality** — Every embedded poll shows "Powered by TheJury" on free tier. Each embed is a free ad on someone else's website.
2. **Anonymous voting** — Low friction. No signup wall for voters = more engagement = more polls created.
3. **SEO for poll results** — Make public poll results pages indexable. "Best pizza topping poll" etc.
4. **Template gallery** — Pre-built templates for common use cases drive organic search traffic.
5. **Integration marketplace** — Slack bot, WordPress plugin, Notion embed, etc.

### 5.5 Implementation Priority for Monetization

1. **Add Stripe integration** — Subscription management, checkout, customer portal
2. **Implement feature gates** — Middleware that checks user tier before allowing premium actions
3. **Add usage tracking** — Track votes per poll, polls per user, API calls per month
4. **Build pricing page** — Clear tier comparison with CTAs
5. **Add "Powered by TheJury" to free embeds** — Instant viral growth channel
6. **Build results export** — Quick win premium feature, high perceived value

---

## 6. Suggested Implementation Order

### Phase 1: Foundation (Weeks 1-2)
Focus: Security fixes + core UX improvements
1. Fix all Critical security issues (CRIT-1 through CRIT-4)
2. Fix N+1 dashboard query (PERF-1)
3. Add rate limiting
4. Add input validation (Zod)
5. Fix broken hover states and UI bugs
6. Add toast notification system
7. Complete Resend/SMTP setup for auth emails

### Phase 2: Core Polish (Weeks 3-4)
Focus: Missing expected features + dashboard improvements
1. User profile page (view/edit)
2. Dashboard pagination, search, and filtering
3. Results export (CSV)
4. Poll sharing (QR codes, social)
5. Shareable results link
6. Poll duplication
7. Skeleton loaders and error boundaries

### Phase 3: Monetization (Weeks 5-6)
Focus: Revenue infrastructure
1. Stripe integration
2. Pricing page
3. Feature gates middleware
4. "Powered by TheJury" on free embeds
5. Usage tracking
6. Pro features: remove branding, custom embed styling

> **TODO before deploying Phase 3:** Set up Stripe account and configure the following:
> 1. Create a Stripe account (or use test mode on existing account)
> 2. Create two Products in Stripe Dashboard: "Pro" ($9/mo) and "Team" ($29/mo)
> 3. Copy the Price IDs (start with `price_`) for each
> 4. Set up a webhook endpoint in Stripe pointing to `https://thejury.app/api/stripe/webhook`
>    - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
> 5. Add the following environment variables to Vercel (and `.env.local` for dev):
>    - `STRIPE_SECRET_KEY` — from Stripe Dashboard > Developers > API keys
>    - `STRIPE_WEBHOOK_SECRET` — from the webhook endpoint config
>    - `STRIPE_PRO_PRICE_ID` — Price ID for the Pro plan
>    - `STRIPE_TEAM_PRICE_ID` — Price ID for the Team plan
>    - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard > Settings > API
> 6. Run the database migration: `supabase/migrations/003_add_stripe_columns.sql`
> 7. (Optional) Configure the Stripe Customer Portal (branding, allowed actions) at https://dashboard.stripe.com/settings/billing/portal

### Phase 4: Growth Features (Weeks 7-10)
Focus: Differentiating features
1. Additional poll types (rating, ranked choice, yes/no)
2. Real-time results (Supabase Realtime)
3. A/B testing UI (leverage existing schema)
4. Vote editing UI (leverage existing schema)
5. Gamification UI (leverage existing schema)
6. API access for Team tier

### Phase 5: Scale (Weeks 11+)
Focus: Team features and enterprise
1. Team workspaces
2. Advanced analytics
3. Webhook notifications
4. Custom branding
5. Presentation mode
6. API SDKs
