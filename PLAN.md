# TheJury — Full Feature Build Plan

## Context

TheJury is an embeddable polling platform. This plan transforms it into a fully-featured, competitive polling platform with proper tier enforcement, new poll types, AI generation, team features, and more.

**User decisions confirmed:**
- Prices: Free / Pro A$15/mo / Team A$39/mo (annual: A$12/A$32)
- Votes: Unlimited for ALL tiers
- Active polls: 5 free, unlimited paid
- Questions per poll: 2 free, unlimited Pro+
- AI generation: 3/mo free, unlimited paid
- Custom domains: Team tier, Coolify integration

---

## Phase 1: Foundation — Pricing, Tier Config, Feature Gating, UX Fixes ✅ DONE

- [x] 1.1 Rewrite Tier Config (`lib/stripe.ts`) — expanded TierConfig, AUD pricing (Free/Pro A$15/Team A$39), annual price IDs
- [x] 1.2 Centralized Feature Gate (`lib/featureGate.ts` + `components/UpgradeModal.tsx`)
- [x] 1.3 Remove Vote Cap + Active Poll Limit (submitVote cleaned, getActivePollCount, togglePollStatus gated)
- [x] 1.4 Fix Error Handling — split loadError/voteError on answer + embed pages
- [x] 1.5 Gate CSV Export & QR Codes — lock icon + upgrade modal for free tier
- [x] 1.6 Pricing Page Annual Toggle — monthly/annual pill, Save % badge, updated feature matrix

**What was built:**
- Rewrote `lib/stripe.ts` with expanded `TierConfig` (all feature flags, annual pricing)
- Created `lib/featureGate.ts` — `canUseFeature()`, `getFeatureLimit()`, `getUpgradeTarget()`
- Created `components/UpgradeModal.tsx` — reusable upgrade upsell with shadcn Dialog + motion
- Removed vote cap from `submitVote()`, added `getActivePollCount()` + active poll limit (5 free)
- Split error state on answer/embed pages: `loadError` (full-page) vs `voteError` (inline banner)
- Gated CSV export + QR codes behind Pro/Team with lock icons + UpgradeModal
- Updated `PricingCards.tsx` with monthly/annual toggle, AUD pricing, "Save X%" badge
- Fixed Stripe checkout/portal redirects — derive URL from request origin header instead of env var
- Added `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_TEAM_ANNUAL_PRICE_ID` env vars

---

## Phase 2: Multi-Question Architecture ✅ DONE

- [x] 2.1 Database Migration (`supabase/migrations/004_add_multi_question.sql`) — poll_questions table, backfill, question_id on poll_options, RLS
- [x] 2.2 Update Types & Helpers — PollQuestion/QuestionResult/QuestionInput interfaces, createPoll/updatePoll/getPollByCode/getPollById/getUserPolls/duplicatePoll/getPollQuestions/getPollResultsByQuestion
- [x] 2.3 Update PollForm — QuestionCard component, multi-question state, "Add Question" gated (2 free, unlimited Pro+), DnD per question
- [x] 2.4 Update Voting Pages — stepper with progress bar (answer + embed), per-question selections, Back/Next/Submit, single transaction, submitVote multi-question fix
- [x] 2.5 Update Results & Export — per-question results on dashboard/public results pages, CSV with question sections, question count badge on dashboard cards

**What was built:**
- Migration `004_add_multi_question.sql` — `poll_questions` table, `question_id` column on `poll_options`, backfill script
- `PollQuestion` interface, updated `Poll` interface with `questions?: PollQuestion[]`
- Updated `createPoll()`, `getPollByCode()`, `getPollById()`, `getPollResults()`, `duplicatePoll()`, `updatePoll()` for multi-question
- Restructured `PollForm.tsx` — `QuestionCard` per question, "Add Question" gated (2 free, unlimited Pro+)
- Answer page: stepper with "Question X of N", Next/Submit navigation, single transaction submit
- Embed page: compact multi-question layout with pagination dots
- Results page: per-question sections, CSV export includes all questions
- Dashboard: question count on poll cards

---

## Phase 3: New Question Types ✅ DONE

- [x] 3.1 Rating Scale (Pro/Team) — star input, avg+distribution results
- [x] 3.2 Ranked-Choice (Pro/Team) — dnd-kit drag-to-rank, avg position + 1st place results
- [x] 3.3 Image Options (Pro/Team) — image grid voting, URL-based image upload
- [x] 3.4 Open-Ended (Team) — textarea input, scrollable responses results, poll_responses table
- [x] 3.5 Reaction Polls (Team) — emoji grid, preset picker, vertical bar results
- [x] 3.6 Feature Gating — type selector with lock icons, UpgradeModal on locked types

**What was built:**
- Rating Scale (Pro/Team): `RatingScaleInput.tsx`, `RatingScaleResults.tsx`, `RatingScaleConfig.tsx`
- Ranked-Choice (Pro/Team): `RankedChoiceInput.tsx`, `RankedChoiceResults.tsx` (drag-to-rank with dnd-kit)
- Image Options (Pro/Team): `ImageOptionInput.tsx`, `ImageUploader.tsx`, migration `005_add_image_options.sql`, `poll-images` Supabase Storage bucket, `/api/upload-image` route
- Open-Ended / Word Cloud (Team): `OpenEndedInput.tsx`, `WordCloudResults.tsx`, `poll_responses` table
- Reaction Polls (Team): `ReactionPollInput.tsx`, `ReactionPollResults.tsx`, `ReactionPollConfig.tsx`
- Question type selector in PollForm with lock icons for unavailable types

---

## Phase 4: Templates, AI Generation, Scheduling UI, Password Protection ✅ DONE

- [x] 4.1 Poll Templates (`lib/templates.ts`, `/templates` page)
- [x] 4.2 AI Poll Generation (API route + modal)
- [x] 4.3 Scheduling UI — gate checkbox, badges on dashboard
- [x] 4.4 Password-Protected Polls — password hash, PasswordGate component

**What was built:**
- `lib/templates.ts` — hardcoded templates, categorized (no DB)
- `/templates` page + `TemplateCards.tsx` — gallery with category filter, tier badges
- `PollForm.tsx` — accepts `?template=` query param to pre-populate
- Migration `006_add_ai_usage.sql` — `ai_poll_usage` table
- `/api/ai/generate-poll` route — AI API call, structured poll data, usage tracking
- `AIGenerateModal.tsx` — prompt input, loading, preview, "Generate with AI" button in PollForm
- Scheduling checkbox gated behind Pro/Team in PollForm (backend already worked)
- Schedule badges on dashboard: "Starts in Xd" (blue), "Ends in Xd" (amber), "Ended" (gray)
- Answer page: "This poll opens in X days. Check back soon!" for scheduled polls
- Migration `007_add_poll_password.sql` — `password_hash TEXT` on polls
- `lib/passwordUtils.ts` — SHA-256 hashing via Web Crypto API
- `PasswordGate.tsx` — password input form, client-side hash comparison
- PollForm: password toggle (Pro/Team gated), hash computed in handleSubmit
- Answer page: PasswordGate shown before poll content if password set
- Embed page: inline compact password form

---

## Phase 5: Charts, Analytics, A/B Testing ✅ DONE

- [x] 5.1 Multiple Chart Types (bar, pie, donut + selector) — pure SVG, no external lib
- [x] 5.2 Advanced Analytics (Team) — votes/day, peak hour/day heatmaps, day-of-week bars
- [x] 5.3 A/B Testing (Team) — variant setup, weighted random assignment, side-by-side results

**What was built:**
- `components/charts/BarChart.tsx` — pure SVG animated horizontal bars with motion, trophy "Leading" badge
- `components/charts/PieChart.tsx` — SVG pie + donut mode (single component, `donut` prop), 12-color palette, interactive hover legend
- `components/charts/ChartSelector.tsx` — bar/pie/donut toggle, free tier bar-only, Pro+ unlocks pie/donut
- `components/charts/index.ts` — barrel exports with `ChartType`, `ChartDataItem` types
- No external chart library — pure SVG implementation
- Dashboard results page: replaced inline bars with chart components, added ChartSelector
- Public results page: replaced inline bars with BarChart component
- `components/analytics/AnalyticsDashboard.tsx` — Team-only: votes/day, peak hour/day heatmaps, day-of-week bars (all derived from `votes.created_at`)
- Migration `008_add_ab_testing.sql` — `ab_experiments`, `poll_variants`, `user_variant_assignments` tables with RLS
- `components/ab-testing/ABTestSetup.tsx` — variant editor, auto-weight balancing, traffic split visualizer
- `components/ab-testing/ABTestResults.tsx` — side-by-side variant comparison with vote counts
- `lib/supabaseHelpers.ts` — `createABExperiment()`, `getABExperiment()`, `assignVariant()` (weighted random, sticky assignments)
- PollForm: ABTestSetup for Team tier, new single-question polls
- Answer page: variant assignment on load, displays variant question text
- Results page: ABTestResults section (Team-gated)

---

## Phase 6: Embed Themes & Branding ✅ DONE

- [x] 6.1 Custom Embed Themes (Pro/Team) — color pickers, font selector, live preview
- [x] 6.2 Custom Logo on Embeds (Team)

**What was built:**
- `components/EmbedThemeEditor.tsx` — EmbedTheme interface, DEFAULT_EMBED_THEME, color pickers (primary, background, text), font selector (Outfit/Inter/DM Sans/Roboto/System Default), border radius slider, live preview
- `app/embed/[pollCode]/page.tsx` — reads theme from `polls.embed_settings`, applies as inline CSS styles (backgroundColor, textColor, borderRadius, fontFamily), primaryColor applied to buttons/progress bar/option states
- Results page: EmbedThemeEditor section (Pro/Team gated) with auto-save on theme change
- `updateEmbedSettings()` helper in supabaseHelpers.ts — saves embed theme to `polls.embed_settings` JSONB
- `embed_settings` added to Poll interface
- Custom logo: Team tier users with `brand_logo_url` on profile get custom logo in embed footer instead of "Powered by TheJury"
- `brand_logo_url TEXT` added to profiles table (in migration 009)

---

## Phase 7: Team Workspace, Webhooks, API, Custom Domains ✅ DONE

- [x] 7.1 Team Workspace (Team) — teams/members tables, invite flow
- [x] 7.2 Webhooks (Team) — webhook dispatcher + manager UI
- [x] 7.3 Public API (Team) — `/api/v1/` routes, API key auth
- [x] 7.4 Custom Domains (Team, Coolify) — DNS verification flow

**What was built:**
- Migration `009_add_teams.sql` — `teams`, `team_members` tables with RLS, `team_id` on polls, `brand_logo_url` on profiles
- Migration `010_add_webhooks_api_domains.sql` — `webhooks`, `api_keys`, `custom_domains` tables with RLS
- `app/(public)/team/page.tsx` — server component, Team tier check, shows CreateTeamForm or TeamDashboard
- `components/team/CreateTeamForm.tsx` — team name input, creates team + owner membership
- `components/team/TeamDashboard.tsx` — member list, invite by email, team polls, role management
- Navbar: Team link (only shows for Team tier users)
- `lib/webhookDispatcher.ts` — `dispatchWebhookEvent(userId, event, payload)`, HMAC-SHA256 signatures, fire-and-forget
- `components/webhooks/WebhookManager.tsx` — CRUD UI for managing webhooks in profile
- `lib/apiAuth.ts` — `validateApiKey()`, `hashApiKey()`, `generateApiKey()` (prefix `jury_`), SHA-256 hashed storage
- `app/api/v1/polls/route.ts` — GET (list polls), POST (create poll) with API key auth
- `app/api/v1/polls/[pollId]/route.ts` — GET (single poll with results)
- `components/api/APIKeyManager.tsx` — generate/revoke API keys in profile
- `components/domains/CustomDomainSetup.tsx` — domain management, DNS TXT record verification UI
- `app/api/domains/verify/route.ts` — DNS TXT record verification endpoint
- ProfilePage: added Webhooks, API Keys, Custom Domains sections (all Team-gated)

---

## Phase 8: Code Audit & Optimization ✅ DONE

- [x] 8.1 Eliminate duplicate Supabase calls — deduplicate fetches across components, colocate data loading
- [x] 8.2 DRY pass — remove duplicate functions, consolidate shared logic, delete dead code
- [x] 8.3 Database query optimization — eliminate N+1 queries, add missing indexes, batch operations
- [x] 8.4 Bundle optimization — audit imports, tree-shake unused deps, lazy-load heavy components
- [x] 8.5 Type safety pass — fix any `any` types, ensure strict TypeScript throughout
- [x] 8.6 Delete unused files — `Container.tsx`, unused exports, stale components

**What was built:**
- Eliminated duplicate `getCurrentUser()` calls — ProfilePage, PollDashboardPage, answer page, embed page all cache user in ref/prop
- Profile page: eliminated double profile fetch (was fetching profile then re-querying subscription; now uses profile data directly)
- Server→client data passing: profile page passes `userId` prop so client doesn't re-auth
- PollDashboardPage: `activePollCount` derived from polls array via `useMemo` (removed separate `getActivePollCount` call), polls+profile fetched in parallel via `Promise.all`
- Answer + embed pages: results + vote count + user fetched in parallel via `Promise.all`
- Results page: user + poll fetched in parallel, results + vote count in parallel
- Migration `011_add_indexes.sql` — 8 performance indexes on polls(code), polls(user_id), poll_options(poll_id), votes(poll_id, user_id), votes(poll_id, fingerprint), api_keys(key_hash), poll_questions(poll_id), webhooks(user_id, is_active)
- Dynamic imports: AnalyticsDashboard, ABTestResults, EmbedThemeEditor lazy-loaded on results page
- `canvas-confetti` dynamically imported at call site (answer page, PollForm, DemoPollWidget) — no longer in main bundle
- Fixed `any` type in usernameGenerator.ts → `SupabaseClient`
- Fixed unsafe `as unknown as Record` cast in results page embed theme save
- Deleted unused `Container.tsx`
- Bundle savings: ~3-5 kB per route in First Load JS, plus deferred loading of tier-gated features

---

## Phase 9: Launch Readiness

- [ ] 9.1 Full build verification — zero errors, zero warnings (actionable ones)
- [ ] 9.2 Feature matrix validation — every tier gate works correctly
- [ ] 9.3 End-to-end smoke test — create poll → vote → results → export for each question type
- [ ] 9.4 Security review — RLS policies, input validation, rate limiting, auth flows
- [ ] 9.5 Environment checklist — all env vars documented, Stripe webhooks configured, Supabase migrations applied
- [ ] 9.6 Performance baseline — page load times, Lighthouse scores

**Goal:** Confirm platform is production-ready and competitive. Hand off for manual testing.

---

## Phase 10: Live Q&A (Slido-style Audience Interaction)

- [ ] 10.1 Q&A Sessions — new `qa_sessions` table (code, title, host_user_id, is_active, settings)
- [ ] 10.2 Question Submission — audience scans QR code, lands on `/qa/[code]`, submits question (no auth required)
- [ ] 10.3 Question Upvoting — audience can upvote existing questions to show interest (fingerprint-based, one vote per question)
- [ ] 10.4 Host Dashboard — `/dashboard/qa/[code]` — real-time incoming questions, sorted by upvotes, mark as answered/dismissed/pinned
- [ ] 10.5 Presenter View — `/qa/[code]/present` — fullscreen display for projecting on screen, shows top questions, auto-updates via Supabase realtime
- [ ] 10.6 Moderation — host can approve/reject questions before they appear publicly (optional setting)
- [ ] 10.7 QR Code + Share — generate QR code for session, share link, embed widget
- [ ] 10.8 Tier Gating — Free: 1 active session, 50 questions max. Pro: unlimited sessions/questions. Team: moderation + presenter view

**Plan:**
- Migration `011_add_qa_sessions.sql` — `qa_sessions`, `qa_questions`, `qa_upvotes` tables
- New pages: `/qa/[code]` (audience), `/dashboard/qa` (host list), `/dashboard/qa/[code]` (host manage), `/qa/[code]/present` (presenter)
- Supabase Realtime subscriptions for live question updates
- Components: `QASubmitForm.tsx`, `QAQuestionList.tsx`, `QAHostDashboard.tsx`, `QAPresenterView.tsx`, `QAModeration.tsx`
- Navbar: "Q&A" link for authenticated users
- Create Q&A session from dashboard with "New Q&A Session" button

---

## Phase 11: Future Enhancements (Backlog)

- [ ] 11.1 Quiz Mode — timed questions, correct answers, leaderboard, gamification
- [ ] 11.2 Presenter Mode for Polls — fullscreen results display, auto-refresh, for projecting at events
- [ ] 11.3 Word Cloud Live — real-time word cloud from audience text input (event-mode)
- [ ] 11.4 Poll Collections / Surveys — group multiple polls into a sequential flow with a single link
- [ ] 11.5 PDF Reports — exportable analytics reports with charts, summary, branding
- [ ] 11.6 Scheduled Email Digests — daily/weekly summary emails for poll owners
- [ ] 11.7 Integrations — Slack/Discord/Teams notifications on votes/responses
- [ ] 11.8 Multi-language (i18n) — interface translation support
- [ ] 11.9 Anonymous Mode Toggle — let poll creators choose identified vs anonymous voting
- [ ] 11.10 Response Limits — max responses per poll (different from vote limits)
- [ ] 11.11 Conditional Logic — skip questions based on previous answers (survey branching)
- [ ] 11.12 White-label — fully remove TheJury branding for enterprise clients

---

## Progress Summary

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ DONE | Foundation — Pricing, Tier Config, Feature Gating, UX Fixes |
| Phase 2 | ✅ DONE | Multi-Question Architecture |
| Phase 3 | ✅ DONE | New Question Types |
| Phase 4 | ✅ DONE | Templates, AI Generation, Scheduling UI, Password Protection |
| Phase 5 | ✅ DONE | Charts, Analytics, A/B Testing |
| Phase 6 | ✅ DONE | Embed Themes & Branding |
| Phase 7 | ✅ DONE | Team Workspace, Webhooks, API, Custom Domains |
| Phase 8 | ✅ DONE | Code Audit & Optimization |
| Phase 9 | Pending | Launch Readiness |
| Phase 10 | Pending | Live Q&A (Slido-style) |
| Phase 11 | Backlog | Future Enhancements |

## Migrations Summary

| File | Phase | Description |
|---|---|---|
| `003_add_stripe_columns.sql` | Pre-plan | Stripe columns on profiles |
| `004_add_multi_question.sql` | 2 | poll_questions table, question_id on poll_options |
| `005_add_image_options.sql` | 3 | image_url on poll_options |
| `006_add_ai_usage.sql` | 4 | ai_poll_usage table |
| `007_add_poll_password.sql` | 4 | password_hash on polls |
| `008_add_ab_testing.sql` | 5 | ab_experiments, poll_variants, user_variant_assignments |
| `009_add_teams.sql` | 7 | teams, team_members, brand_logo_url on profiles |
| `010_add_webhooks_api_domains.sql` | 7 | webhooks, api_keys, custom_domains |
| `011_add_indexes.sql` | 8 | Performance indexes on frequently queried columns |
| `012_add_qa_sessions.sql` | 10 | qa_sessions, qa_questions, qa_upvotes (planned) |

## Phase Dependencies

```
Phase 1 (Foundation) ✅ → required by all
Phase 2 (Multi-Question) ✅ → required by Phase 3 and Phase 4
Phase 3 (Question Types) ✅ → depends on Phase 2
Phase 4 (Templates/AI) ✅ → depends on Phase 2
Phase 5 (Charts/Analytics) ✅ → independent (after Phase 1)
Phase 6 (Embed Themes) ✅ → independent (after Phase 1)
Phase 7 (Team/API/Webhooks) ✅ → independent (after Phase 1)
Phase 8 (Audit) ✅ → after Phases 6+7 (audit everything)
Phase 9 (Launch) → after Phase 8
Phase 10 (Live Q&A) → after Phase 9 (post-launch feature)
Phase 11 (Backlog) → as needed
```

## Verification Strategy

After each phase:
1. `next build` passes with zero errors
2. Existing polls continue to work (no regressions)
3. Feature gates work correctly per tier
4. New features functional end-to-end (create → vote → results)
5. Responsive on mobile
6. Dark/light mode both work
