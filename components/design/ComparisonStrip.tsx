import { Check, Minus } from "lucide-react";

// Competitor facts researched September 2026 from each vendor's own security /
// pricing pages (hosting and anonymity: high confidence; entry prices vary by
// source and change over time — see the footnote). Kept fair: Google Forms is
// credited with free CSV export, and competitors' anonymous-by-default support.
// CLAIM-FLAG: the TheJury column's "Anonymous voting", "Verified voting" and the
// PDF half of "Results record" are target-state. CSV export and Australian
// hosting exist today; confirm the rest before relying on this table publicly.

type Cell = true | false | string;

const COLUMNS = ["TheJury", "Google Forms", "Mentimeter", "Slido"] as const;

const ROWS: { label: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { label: "Hosted in Australia", cells: [true, false, false, false] },
  { label: "Anonymous voting", cells: [true, "With setup", true, true] },
  {
    label: "Verified voting (one link per member)",
    cells: [true, false, "Enterprise SSO", "Paid add-on"],
  },
  {
    label: "Results record",
    cells: ["PDF & CSV", "CSV (free)", "Paid export", "Paid export"],
  },
  {
    label: "Price for a small organisation",
    cells: ["From A$9/mo", "Free", "From US$12/mo", "From ~US$10/mo"],
  },
];

function CellValue({ value, primary }: { value: Cell; primary: boolean }) {
  if (value === true) {
    return (
      <Check
        size={18}
        strokeWidth={2.4}
        className={primary ? "mx-auto text-jury-emerald" : "mx-auto text-jury-body"}
        aria-label="Yes"
      />
    );
  }
  if (value === false) {
    return (
      <Minus size={18} className="mx-auto text-jury-faint" aria-label="No" />
    );
  }
  return (
    <span
      className={`text-[13px] ${
        value === "Check"
          ? "text-jury-dim italic"
          : primary
            ? "font-semibold text-jury-text"
            : "text-jury-body"
      }`}
    >
      {value}
    </span>
  );
}

/**
 * Homepage comparison strip. Factual and conservative: TheJury's own column is
 * filled, competitor columns stay "Check" until the facts are confirmed.
 */
export function ComparisonStrip() {
  return (
    <section className="border-t border-jury-border-subtle bg-jury-base">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-14 lg:py-[72px]">
        <h2 className="font-display text-3xl text-jury-text sm:text-[34px]">
          How it compares
        </h2>
        <p className="mt-2 text-[15px] text-jury-muted sm:text-[17px]">
          For an Australian organisation running a real vote.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-jury-border">
                <th className="py-3 pr-4 text-[13px] font-medium text-jury-dim" />
                {COLUMNS.map((c, i) => (
                  <th
                    key={c}
                    className={`px-4 py-3 text-center text-[14px] font-semibold ${
                      i === 0 ? "text-jury-emerald" : "text-jury-muted"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-jury-border-subtle"
                >
                  <td className="py-3.5 pr-4 text-[14px] text-jury-body">
                    {row.label}
                  </td>
                  {row.cells.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3.5 text-center ${
                        i === 0 ? "bg-jury-emerald-tint/40" : ""
                      }`}
                    >
                      <CellValue value={cell} primary={i === 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[12px] text-jury-dim">
          Details as at September 2026, from each vendor&apos;s own pages. Google
          Forms is free but stores data outside Australia. Competitor prices are
          entry paid tiers, per host or user, billed annually in USD; each also
          has a limited free tier.
        </p>
      </div>
    </section>
  );
}
