# Comparison-table claims: source record

TheJury makes comparative claims about named competitors on the homepage
(`components/design/ComparisonStrip.tsx`) and the "For presenters" page. Under
the Australian Consumer Law, comparative advertising must be accurate and not
misleading, and it must **stay** accurate as competitors change their pricing
and features. This file is the record of where each figure came from so the
claims can be re-checked on a schedule.

**Review cadence:** re-verify every competitor figure **quarterly**, and before
any campaign that leans on the comparison. Update the "as at" date in
`ComparisonStrip.tsx` and the rows below whenever a figure is re-checked or
changed. Keep a dated screenshot of each source page in the team drive.

- **Last full review:** 28 September 2026
- **Next review due:** 28 December 2026
- **Owner:** Richard (RAVENCI)

---

## TheJury's own column (read this first)

Some cells in TheJury's own column are **target-state**, not shipped today. This
is flagged in code (`CLAIM-FLAG` comments in `ComparisonStrip.tsx`,
`PricingCards.tsx`, `app/(public)/security/page.tsx`). Do **not** rely on the
comparison publicly until these are confirmed:

| Claim | Status today | Notes |
| --- | --- | --- |
| Hosted in Australia | ✅ Live | Confirm exact region on the Security page. |
| CSV results record | ✅ Live | `lib/exportUtils.ts`, gated to paid tiers. |
| PDF results record | ❌ Not built | Homepage/pricing say "PDF & CSV"; only CSV exists. |
| Anonymous voting | ❌ Not built | No `anonymous` column on the `polls` table. |
| Verified voting (one link per member) | ❌ Not built | No data model yet. |

Until the ❌ items ship, the marketing that promises them is ahead of the
product. Either build them, relabel as "coming soon", or remove the claim.

---

## Competitor figures

Confidence: **High** = taken directly from the vendor's own current page;
**Medium** = varies by plan/region/billing period and should be re-read each
review.

### Google Forms
- **Price for a small org: "Free"** — High. Free with a Google account.
  Business use is bundled into Google Workspace, so "free" is fair for the
  standalone product. Source: workspace.google.com / Google Forms.
- **Hosted in Australia: No** — High. Google stores data across global regions;
  data residency is not guaranteed to Australia on standard plans.
- **Anonymous voting: "With setup"** — Medium. Possible by turning off email
  collection, but not the default. Source: Google Forms settings docs.
- **Results record: "CSV (free)"** — High. Exports responses to Sheets/CSV.

### Mentimeter
- **Price: "From US$12/mo"** — Medium. Entry paid tier, per user, billed
  annually, in USD; a limited free tier exists. **Re-read each review** —
  Mentimeter changes tiers and pricing periodically. Source:
  mentimeter.com/pricing.
- **Anonymous voting: Yes** — High. Anonymous by default.
- **Verified voting: "Enterprise SSO"** — Medium. Identified participation is an
  enterprise/SSO capability, not per-member links. Source: Mentimeter
  enterprise pages.
- **Results record: "Paid export"** — Medium. Export/reporting gated to paid.

### Slido
- **Price: "From ~US$10/mo"** — Medium (note the "~"). Entry paid tier, billed
  annually, in USD; a limited free tier exists. **Re-read each review.**
  Source: slido.com/pricing.
- **Anonymous voting: Yes** — High. Anonymous by default.
- **Verified voting: "Paid add-on"** — Medium. Participant identification/SSO on
  higher tiers. Source: Slido plan comparison.
- **Results record: "Paid export"** — Medium. Analytics/export gated to paid.

---

## If challenged

If a competitor or the ACCC queries a claim, the defensible position is: figures
were taken from each vendor's own public pages on the dated review, the
comparison states it is "as at [date], from each vendor's own pages", prices are
described as entry paid tiers in USD, and each competitor's free tier is
acknowledged. Keep the dated source screenshots to back this up.
