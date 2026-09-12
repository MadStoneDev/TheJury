# Feature gating audit

Where Free-tier limits are actually enforced, as of this pass. TL;DR: **only
AI generation is enforced server-side.** Every other gate is UI-only, backed at
the data layer solely by row-level security that checks _ownership_, not
_subscription tier_.

## Architecture context

- Most reads/writes go through `lib/supabaseHelpers.ts`, which imports the
  **browser** Supabase client (`lib/supabase.ts` → `lib/supabase/client.ts`).
  So `createPoll`, `updatePoll`, `togglePollStatus`, `updateEmbedSettings`,
  etc. run **in the browser** with the anon key.
- RLS policies (`supabase/migrations/*`) gate rows by `user_id` ownership
  (e.g. "Users can manage their poll questions"). **No policy checks
  `subscription_tier`.** A user can therefore call Supabase directly with their
  own anon key and write anything the UI hides, as long as they own the poll.

## Enforced server-side ✅

| Limit | Where | Notes |
|---|---|---|
| AI generation: 3/month (Free) | `app/api/ai/generate-poll/route.ts` | Real server route. Checks `subscription_tier` + `ai_poll_usage.usage_count` before generating, then increments. Also IP + per-user rate limits. |

**Caveat on the AI limit:** the counter lives in `ai_poll_usage`, and migration
`006_add_ai_usage.sql` grants `"Users can manage own AI usage"`. A determined
user could reset their own `usage_count` via a direct Supabase call and get more
than 3/month. To make it tamper-proof, tighten that policy to read-only for
users and write the counter only from the service-role route.

## Client-only ⚠️ (UI hides it; nothing stops a crafted request)

All gated in the browser via `canUseFeature` / `getFeatureLimit`, then written
with the browser Supabase client. RLS allows the write because the user owns the
poll.

| Feature | UI gate | Bypass risk |
|---|---|---|
| Question types (ranked / image / open-ended / reactions are Pro; MC + rating are Free) | `components/PollForm.tsx` (`QUESTION_TYPES` + `canUseFeature`); insert in `createPoll` | A Free user can insert a `poll_questions` row with any `question_type`. |
| Questions per poll (Free = 2) | `PollForm` (`getFeatureLimit(..., "maxQuestionsPerPoll")`) | `createPoll` will insert any number of `poll_questions`. |
| Poll scheduling (start/end dates) | `PollForm` scheduling toggle | `start_date`/`end_date` are written client-side regardless. |
| Password protection | `PollForm` password toggle (`lib/passwordUtils`) | `password_hash` is written client-side. |
| Custom embed themes | `app/(public)/dashboard/results/[pollCode]/page.tsx` → `updateEmbedSettings` | `embed_settings` written client-side. |
| CSV export | results page `handleExportCSV` | Export runs entirely in the browser from already-fetched data — inherently client-side. |
| QR codes | share/QR UI | Generated in-browser; inherently client-side. |
| Remove branding | `app/embed/[pollCode]/page.tsx` reads owner tier and conditionally renders branding | Display-only decision; a self-hosted embed could drop it. |
| Presenter mode | `app/present/[pollCode]/page.tsx` reads tier and redirects | Client-side check in a client page. |
| Templates (Free = off) | `app/(public)/templates/page.tsx` (server-read tier) but applying a template just prefills the client form | Enforcement is client-side; templates are only a starting point. |

## Not gated any more

- **Active poll count** — Free is now unlimited (`maxActivePolls: -1`), so the
  old client-side check in `togglePollStatus` never triggers and the dashboard
  meter was removed.

## Recommendation

If any of these limits need to be real (question types and questions-per-poll
are the most abusable), move the poll create/update path to a server route or
Server Action that re-checks the user's tier with the server Supabase client
before writing — or add tier checks into the RLS policies. Until then, treat the
client-only rows above as advisory, not enforced.
