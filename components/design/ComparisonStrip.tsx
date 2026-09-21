import { Check, Minus } from "lucide-react";

// CLAIM-FLAG: the TheJury column asserts anonymous-enforced voting, verified
// one-vote-per-member and a PDF results record. CSV export exists today; the
// others are target-state — confirm before launch.
// Competitor cells are deliberately left as "Check": do not publish a claim
// about Google Forms or Mentimeter/Slido until it has been verified (per brief).

type Cell = true | false | string;

const COLUMNS = ["TheJury", "Google Forms", "Mentimeter / Slido"] as const;

const ROWS: { label: string; cells: [Cell, Cell, Cell] }[] = [
  { label: "Hosted in Australia", cells: [true, "Check", "Check"] },
  { label: "Anonymous voting enforced", cells: [true, "Check", "Check"] },
  { label: "Verified one vote per member", cells: [true, "Check", "Check"] },
  {
    label: "Results record for the minutes",
    cells: ["PDF & CSV", "Check", "Check"],
  },
  {
    label: "Price for a small organisation",
    cells: ["From A$9/mo", "Check", "Check"],
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
          &ldquo;Check&rdquo; means we haven&apos;t verified that detail for
          another product and won&apos;t claim it until we have.
        </p>
      </div>
    </section>
  );
}
