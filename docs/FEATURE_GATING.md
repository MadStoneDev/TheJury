# Feature gating audit

Where Free-tier limits are enforced. As of the server-enforcement pass, the
poll create/update/toggle path, embed themes, CSV export and the AI counter are
all enforced on the server. QR codes and branding remain display-only.

## Architecture

- Poll mutations now go through **server actions** in `app/actions/polls.ts`
  (`createPollAction`, `updatePollAction`, `togglePollStatusAction`,
  `updateEmbedSettingsAction`, `exportPollCsvAction`). Each loads the user's
  tier from the DB with the server Supabase client and rejects violations
  before writing. The shared write logic lives in `lib/pollWrites.ts`
  (client-agnostic) and the tier rules in `lib/tierEnforcement.ts`.
- `lib/supabaseHelpers.ts` still exposes `createPoll`/`updatePoll`/… but they
  now delegate to `lib/pollWrites.ts` with the browser client, and are only
  used internally (e.g. `duplicatePoll`). The UI calls the server actions.

## Enforced server-side ✅

| Limit | Where | How |
|---|---|---|
| Questions per poll (Free = 2) | `createPollAction` / `updatePollAction` → `validatePollWriteForTier` | Rejects if `questions.length > maxQuestionsPerPoll`. |
| Non-Free question types (ranked / image / open-ended / reactions) | same | Rejects any question whose `featureKey` the tier lacks. Free keeps multiple-choice + rating. |
| Scheduling (start/end dates) | same | Rejects `start_date`/`end_date` for tiers without `scheduling`. |
| Password protection | same | Rejects `password_hash` for tiers without `passwordProtect`. |
| Custom embed theme | `updateEmbedSettingsAction` → `canSaveEmbedTheme` | Rejects the save for tiers without `customEmbedThemes`. |
| CSV export | `exportPollCsvAction` → `canExportCsv` | The CSV bytes are built server-side and only returned to tiers with `csvExport`. The client just downloads the returned string. |
| Poll activate/deactivate | `togglePollStatusAction` | Ownership checked server-side (Free polls are unlimited, so no count gate). |
| AI generation: 3/month (Free) | `app/api/ai/generate-poll/route.ts` | Checks tier + `ai_poll_usage` before generating. **Now tamper-proof:** migration 014 makes `ai_poll_usage` read-only for users; the counter is written with the service role, so a user can no longer reset it. |

All rejections return a user-facing string that the existing UI surfaces
(PollForm/results toasts, upgrade modal).

## Still display-only ⚠️

| Feature | Why it's not a server gate |
|---|---|
| QR codes | Generated client-side (`qrcode.react`) from the poll's public URL. The button is hidden for non-Pro via the server-provided tier, but a QR of a public link is not a data-integrity concern. |
| Remove branding | Applied at embed render time from the **owner's** `subscription_tier` read from the DB (`app/embed/[pollCode]/page.tsx`), so it already reflects the true tier. Not a mutation. |

## Residual risk (recommended follow-up)

The server actions are the only path the app UI uses, and they enforce tier
before writing. However, RLS on `polls` / `poll_questions` still allows an owner
to INSERT/UPDATE their own rows directly. A technical user could therefore call
Supabase REST directly and bypass the action-layer tier checks. `ai_poll_usage`
is the one table locked down this pass (migration 014).

To fully close the gap, add tier checks to the `polls` / `poll_questions` RLS
policies (e.g. a policy that rejects non-Free `question_type` or a non-null
`password_hash`/`start_date` when the owner's `subscription_tier = 'free'`), or
route all poll writes through the service role and restrict direct writes. That
is a larger, separately-testable migration and was intentionally left out of
this pass.
