import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { Accent } from "../IconTile";
import { EYEBROW, ACCENT_TEXT } from "../accents";

interface FeatureRowProps {
  eyebrow: string;
  title: string;
  body: string;
  checklist?: string[];
  /** Put the visual on the left instead of the right. */
  reverse?: boolean;
  /** Use the alternating (bg/alt) background. */
  altBg?: boolean;
  accent: Accent;
  visual: ReactNode;
}

/**
 * One alternating 2-column feature section on a use-case page: copy on one
 * side, a themed visual on the other. Backgrounds alternate base/alt.
 */
export function FeatureRow({
  eyebrow,
  title,
  body,
  checklist,
  reverse = false,
  altBg = false,
  accent,
  visual,
}: FeatureRowProps) {
  return (
    <section
      className={`border-t border-jury-border-subtle ${
        altBg ? "bg-jury-alt" : "bg-jury-base"
      }`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-14 lg:grid-cols-2 lg:gap-16 lg:py-[72px]">
        <div className={reverse ? "lg:order-2" : ""}>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-[12px] ${EYEBROW[accent]}`}
          >
            {eyebrow}
          </span>
          <h2 className="mt-4 font-display text-[26px] leading-[1.15] text-jury-text sm:text-[36px]">
            {title}
          </h2>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-jury-muted sm:text-[17px]">
            {body}
          </p>
          {checklist && checklist.length > 0 && (
            <ul className="mt-5 space-y-2.5">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check
                    size={16}
                    strokeWidth={2.4}
                    className={`mt-0.5 shrink-0 ${ACCENT_TEXT[accent]}`}
                  />
                  <span className="text-[15px] text-jury-body">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}
