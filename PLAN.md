# TheJury — Full Feature Build Plan

## Phase 1: Foundation — Pricing, Tier Config, Feature Gating, UX Fixes ✅ DONE

- [x] 1.1 Rewrite Tier Config (`lib/stripe.ts`) — expanded TierConfig, AUD pricing (Free/Pro A$15/Team A$39), annual price IDs
- [x] 1.2 Centralized Feature Gate (`lib/featureGate.ts` + `components/UpgradeModal.tsx`)
- [x] 1.3 Remove Vote Cap + Active Poll Limit (submitVote cleaned, getActivePollCount, togglePollStatus gated)
- [x] 1.4 Fix Error Handling — split loadError/voteError on answer + embed pages
- [x] 1.5 Gate CSV Export & QR Codes — lock icon + upgrade modal for free tier
- [x] 1.6 Pricing Page Annual Toggle — monthly/annual pill, Save % badge, updated feature matrix

---

## Phase 2: Multi-Question Architecture ✅ DONE

- [x] 2.1 Database Migration (`supabase/migrations/004_add_multi_question.sql`) — poll_questions table, backfill, question_id on poll_options, RLS
- [x] 2.2 Update Types & Helpers — PollQuestion/QuestionResult/QuestionInput interfaces, createPoll/updatePoll/getPollByCode/getPollById/getUserPolls/duplicatePoll/getPollQuestions/getPollResultsByQuestion
- [x] 2.3 Update PollForm — QuestionCard component, multi-question state, "Add Question" gated (2 free, unlimited Pro+), DnD per question
- [x] 2.4 Update Voting Pages — stepper with progress bar (answer + embed), per-question selections, Back/Next/Submit, single transaction, submitVote multi-question fix
- [x] 2.5 Update Results & Export — per-question results on dashboard/public results pages, CSV with question sections, question count badge on dashboard cards

---

## Phase 3: New Question Types ✅ DONE

- [x] 3.1 Rating Scale (Pro/Team) — star input, avg+distribution results
- [x] 3.2 Ranked-Choice (Pro/Team) — dnd-kit drag-to-rank, avg position + 1st place results
- [x] 3.3 Image Options (Pro/Team) — image grid voting, URL-based image upload
- [x] 3.4 Open-Ended (Team) — textarea input, scrollable responses results, poll_responses table
- [x] 3.5 Reaction Polls (Team) — emoji grid, preset picker, vertical bar results
- [x] 3.6 Feature Gating — type selector with lock icons, UpgradeModal on locked types

---

## Phase 4: Templates, AI Generation, Scheduling UI, Password Protection

- [ ] 4.1 Poll Templates (`lib/templates.ts`, `/templates` page)
- [ ] 4.2 AI Poll Generation (API route + modal)
- [ ] 4.3 Scheduling UI — gate checkbox, badges on dashboard
- [ ] 4.4 Password-Protected Polls — password hash, PasswordGate component

---

## Phase 5: Charts, Analytics, A/B Testing

- [ ] 5.1 Multiple Chart Types (bar, pie, donut + selector)
- [ ] 5.2 Advanced Analytics (Team) — timing, completion, heatmap
- [ ] 5.3 A/B Testing (Team) — variant setup + results comparison

---

## Phase 6: Embed Themes & Branding

- [ ] 6.1 Custom Embed Themes (Pro/Team) — color pickers, font selector, live preview
- [ ] 6.2 Custom Logo on Embeds (Team)

---

## Phase 7: Team Workspace, Webhooks, API, Custom Domains

- [ ] 7.1 Team Workspace (Team) — teams/members tables, invite flow
- [ ] 7.2 Webhooks (Team) — webhook dispatcher + manager UI
- [ ] 7.3 Public API (Team) — `/api/v1/` routes, API key auth
- [ ] 7.4 Custom Domains (Team, Coolify) — DNS verification flow

---

## Phase Dependencies

```
Phase 1 (Foundation) ✅ → required by all
Phase 2 (Multi-Question) → required by Phase 3 and Phase 4
Phase 3 (Question Types) → depends on Phase 2
Phase 4 (Templates/AI) → depends on Phase 2
Phase 5 (Charts/Analytics) → independent (after Phase 1)
Phase 6 (Embed Themes) → independent (after Phase 1)
Phase 7 (Team/API/Webhooks) → independent (after Phase 1)
```
