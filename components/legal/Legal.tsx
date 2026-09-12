import type { ReactNode } from "react";

/** Shared shell + typographic primitives for the legal pages (jury tokens). */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jury-base">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
        <h1 className="font-display text-[36px] leading-[1.1] text-jury-text sm:text-[48px]">
          {title}
        </h1>
        <p className="mt-3 text-[14px] text-jury-dim">Last updated: {updated}</p>
        <div className="mt-10 space-y-8">{children}</div>
        <p className="mt-12 rounded-xl border border-jury-border bg-jury-surface p-4 text-[13px] leading-relaxed text-jury-dim">
          This is a starting template, not legal advice. Have it reviewed by a
          qualified professional before relying on it.
        </p>
      </div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[22px] text-jury-text sm:text-[24px]">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-jury-muted">
        {children}
      </div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-jury-emerald" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
