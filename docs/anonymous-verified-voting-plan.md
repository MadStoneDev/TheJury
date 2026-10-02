# Anonymous & verified voting — implementation plan

These are the two headline Organisation features on the homepage and pricing
page. Neither is built today: the `polls` table has no anonymity or verification
columns, and votes are written **client-side** (browser Supabase client, anon
key), with double-voting prevented only by unique indexes on
`votes(poll_id, user_id)` and `votes(poll_id, voter_fingerprint)` (migration
`013_audit_fixes.sql`).

Because this is the core of the product's trust pitch, it must be built
correctly and in order. **A half-built version that leaks who voted, or lets a
member vote twice, is worse than not shipping it.**

> **Ordering constraint:** the database migration must be applied to the live
> Coolify DB (run by Richard) *before* any app code that references the new
> columns/tables is deployed — otherwise production queries break. Build order
> below respects this.

---

## 1. What each feature means (the guarantees)

**Anonymous voting** — the poll *owner* cannot see who cast which ballot.
- One person, one vote is still enforced.
- For an anonymous poll we do **not** store `user_id` on the vote (even for
  signed-in voters) and we do **not** expose any voter identifier in results.
- Dedup uses a per-poll **salted hash** of the identifier, stored on the vote,
  never the raw identifier. The owner sees tallies and turnout counts, never
  identities.
- Honest limit to state on the Security page: anonymity is *from the poll
  owner*. Server operators/DB admins are covered by the hosting/security policy,
  not cryptographic anonymity. Don't overclaim.

**Verified voting (one link per member)** — only invited members can vote, once.
- Owner adds a member list (labels and/or emails).
- Each member gets a unique, unguessable **token**; the vote link is
  `/answer/{CODE}?t={TOKEN}`.
- A token can be redeemed exactly once. Redeeming it records the vote and marks
  the token used, **atomically**.
- Owner sees **turnout** (which members have voted) but, if the poll is *also*
  anonymous, not how each voted. Verified + anonymous is the AGM ballot case and
  must compose.

---

## 2. Why a server-side vote path is required

Client-side RLS cannot safely enforce "consume this token exactly once *and*
insert the vote, atomically" — a malicious client controls exactly what it
inserts and can mark a token used without voting, or vote without a valid token.
Anonymous dedup by client-supplied fingerprint is likewise trivially spoofed.

**Therefore:** verified and anonymous polls must submit votes through a
**server-side path** — a Postgres `SECURITY DEFINER` function called via RPC, or
a Next.js server action / API route using the service-role key. Recommendation:
a `SECURITY DEFINER` SQL function `cast_verified_vote(...)` so the token check,
vote insert, and token-consume happen in one transaction inside the database.
Open polls keep the existing client-side path unchanged.

---

## 3. Database migration

The finalised, hardened migration is
**`supabase/migrations/017_verified_anonymous_voting.sql`** — that file is the
source of truth (this section is just an overview). It adds:

- `polls.is_anonymous`, `polls.requires_verification`.
- `app_secrets` (global pepper) and `poll_anon_salts` (per-poll salt) — both RLS
  on with no policy and REVOKEd from app roles; only SECURITY DEFINER functions
  read them.
- `poll_members` (token, required label, optional email, `used_at`), with owners
  granted SELECT on everything **except `used_at`**.
- `votes.anon_hash` and `votes.member_id`, each with a partial unique index for
  dedup.
- Functions: `add_poll_members()` (owner+tier checked, generates url-safe
  tokens), `get_poll_turnout()` (used/total only), and `cast_verified_vote()`
  (the sole vote path for these polls — validates tier, active/time-window,
  option membership and the member token, computes `anon_hash` server-side, and
  never stores `user_id`).

Keep the existing client-side insert path for open, non-anonymous polls (no
behaviour change there).

---

## 4. Tier gating

Add two feature keys to `TierConfig` (`lib/stripe.ts`) — `anonymousVoting`,
`verifiedVoting` — both `false` on Free, `true` on `pro`/`team`. Add labels +
descriptions in `lib/featureGate.ts`. Enforce server-side in the vote path and
in poll create/update (`lib/tierEnforcement.ts`), not just the UI.

---

## 5. App changes

- **Create/Edit (`components/PollForm.tsx`)**: two gated toggles ("Anonymous
  voting", "Require a member link to vote"). When verification is on, a member
  editor: paste/CSV names or emails → generates the roll on save. Show the
  generated links for copy/download, and (optional, later) email them.
- **Answer flow (`app/answer/[pollCode]/page.tsx` + `lib/supabaseHelpers.ts`)**:
  if `requires_verification`, read `?t=` token, block voting without a valid
  unused token, and submit through `cast_verified_vote` RPC. If `is_anonymous`,
  submit through the RPC with a server-computed `anon_hash` and no `user_id`.
- **Results (`.../results/[pollCode]`)**: for verified polls show a **turnout**
  panel (used / total). For anonymous polls, suppress any per-voter detail and
  label results "Anonymous". The PDF results record should note the mode.
- **Marketing/Security copy**: once shipped, remove the `CLAIM-FLAG`s and state
  the honest anonymity guarantee (anonymous *to the owner*).

---

## 6. Build order (phased)

1. **Migration** (`017`) — ✅ written. Richard applies it to Coolify, then
   regenerates `database.types.ts` (a bridge is committed in the meantime).
2. **Tier keys + enforcement** — ✅ `anonymousVoting`/`verifiedVoting` in
   `TierConfig`, enforced in `validatePollWriteForTier`.
3. **Create/Edit UI** — ✅ gated toggles + member editor + CSV link export on
   the success screen (member management on existing polls is a follow-up).
4. **Vote path** — ✅ `cast_verified_vote` RPC wired into the answer flow, with
   the member-link gate and no identity stored on protected polls.
5. **Results** — ✅ turnout badge (aggregate RPC) + anonymous label + PDF note.
6. **Copy** — ✅ Security page rewritten to the honest guarantees;
   comparison/pricing CLAIM-FLAGs cleared.

Each phase is independently reviewable and committed separately. Phases 2–6 are
app code that must not deploy before Phase 1 is live.

### Deploy checklist (Richard)

1. Apply `supabase/migrations/017_verified_anonymous_voting.sql` on Coolify.
2. Regenerate `database.types.ts` from the live DB and confirm it matches the
   hand-written bridge (polls flags, votes columns, `poll_members`, the three
   functions).
3. Merge `feat/au-public-review-fixes`, then `feat/verified-anonymous-voting`.
4. Smoke-test by running `supabase/test_017.sql` (transactional, rolls back) —
   it asserts: direct client insert rejected for anonymous and verified polls
   (including as a non-owner who can't see the poll); open-poll direct insert
   still works; token redeem once / reuse rejected / no-token rejected;
   anonymous dedup for signed-in and guest-fingerprint; Free owner can't enable
   a flag by direct update while a paid owner can; a downgraded owner's active
   poll still accepts votes; and the owner cannot read `poll_members.used_at`,
   `app_secrets` or `poll_anon_salts`.

### Follow-ups (not in this branch)

- Manage the member roll on an **existing** poll (add/remove after creation).
  Removal must handle the `votes.member_id` FK — either block deleting a voted
  member with a clear message, or choose an explicit `ON DELETE` behaviour — and
  only then re-grant `DELETE` on `poll_members`.
- Email the member links from TheJury (needs the email sender + rate limits).
- **Anonymous raw-read hardening** — ✅ done in `018`. Pulled the live `votes`
  policies (the permissive "Anyone can view votes for active polls" exposes raw
  rows to any client). A column-level hide would have broken the client tally,
  the analytics `created_at` read and the `select("*")` count queries, so `018`
  instead **coarsens the timestamp at the source**: anonymous ballots store
  `created_at` truncated to the day (precise for non-anonymous), removing the
  ordering/when-did-they-vote correlation for every reader. `test_018.sql`
  covers it. Remaining identifiers on an anonymous ballot are already NULL
  (user_id/voter_fingerprint/member_id) or a non-reversible HMAC (anon_hash); if
  you later want anon_hash off the readable row entirely, move it to an
  RLS-locked dedup side table.

---

## 7. Decisions (answered)

1. **Anonymity scope wording** — state "anonymous to the poll owner" honestly on
   the Security page, and note hosting/admin access is covered by the security
   policy.
2. **Member distribution** — copy/download links (CSV) only for now; email
   distribution later.
3. **Member identifier** — label required, email optional.
4. **Signed-in verified voting** — the token is the sole gate; no login
   required. `cast_verified_vote` never stores `user_id`.

### Security hardening applied to migration 017

- **Compose without linkage.** `member_id` is stored on the vote only for
  verified **non-anonymous** polls. For verified **anonymous** polls it is NULL;
  one-vote is enforced by consuming the token's `used_at` atomically, so the
  ballot is unlinkable to a member.
- **No timing correlation.** Owners cannot read `poll_members.used_at` (column
  grant omits it) or per-member redemption times; turnout is exposed only as
  used/total via `get_poll_turnout()`.
- **Salt + pepper, unreadable.** The per-poll salt lives in `poll_anon_salts`
  (RLS on, no policy, REVOKEd) — not on `polls` — and is combined with a global
  `app_secrets.pepper` in the HMAC. Neither is readable by any app role, so the
  owner cannot recompute `anon_hash`.
- **Server-computed hash.** The client never sends `anon_hash`;
  `cast_verified_vote` computes it from `auth.uid()` + salt + pepper.
- **The function checks everything** (it bypasses RLS): token required when
  `requires_verification`, poll active + in time window, options belong to the
  poll, and the owner's tier allows the feature.
- **Tokens** are generated server-side with `gen_random_bytes(24)`, url-safe.
- **`Referrer-Policy: no-referrer`** is set on `/answer/[pollCode]` (see
  `next.config.ts`) so the `?t=` token can't leak via the `Referer` header.
- **Honest limit documented:** guest (not-signed-in) voting on an anonymous poll
  is now deduped best-effort by a server-side hash of the device fingerprint
  (see round 2) — but a fingerprint is spoofable, so verified voting remains the
  hard guarantee. This is stated on the Security page.

### Security hardening — round 2 (from the pre-apply review)

- **Client insert path closed.** A RESTRICTIVE `INSERT` policy on `votes` rejects
  direct client inserts for any poll that is anonymous or requires verification,
  so those polls can only be voted on through `cast_verified_vote`. It ANDs with
  the existing permissive policy, so it needed no knowledge of that policy. The
  flag check goes through a `SECURITY DEFINER` helper
  (`poll_uses_protected_voting`), **not** a subquery on `polls` — a subquery
  would run as the voter and, if the poll row is hidden from them by RLS, a
  `NOT EXISTS` check would wrongly pass and re-open the path. The helper always
  sees the real flags.
- **pgcrypto schema.** The migration and all functions use
  `search_path = public, extensions` so `gen_random_bytes()` / `hmac()` resolve
  whether pgcrypto is in `extensions` (Supabase) or `public`.
- **Guest dedup restored.** `cast_verified_vote` takes a fingerprint, hashes it
  server-side (salt + pepper, with a `uid:` / `fp:` domain separator) into
  `anon_hash`, and never stores the raw value.
- **Grandfathering.** The vote-time tier check is removed, so a poll keeps
  accepting votes if its owner downgrades mid-poll. Tier is instead enforced by
  a `BEFORE INSERT/UPDATE` trigger on `polls` that fires only when a flag flips
  ON — which also stops a Free user enabling the feature by writing to `polls`
  directly.
- **Member deletion deferred safely.** No `DELETE` grant on `poll_members` yet
  (a voted member would hit the `votes.member_id` FK), so the roll is
  create-only until the member-management follow-up handles it explicitly.
- **Verified + anonymous shared-device fix.** `anon_hash` is computed only for
  anonymous polls that are **not** verified. On a verified poll the single-use
  token is the dedup; adding a fingerprint hash there would make two members
  voting from the same device collide, wrongly rejecting the second despite a
  valid token. `test_017.sql` §5c is the regression test.
