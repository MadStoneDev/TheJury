import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/motion";

interface UseCasePlaceholderProps {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  points: string[];
}

/**
 * Shared "coming soon" body for the /for/* use-case pages.
 * Visual language matches the marketing site (font-display + gradient-text).
 */
export default function UseCasePlaceholder({
  eyebrow,
  title,
  highlight,
  description,
  points,
}: UseCasePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <ScrollReveal>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {eyebrow} · Coming soon
        </span>
        <h1 className="text-4xl sm:text-5xl font-display leading-[1.1] text-foreground mb-4">
          {title} <span className="gradient-text">{highlight}</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <ul className="mt-10 grid gap-3 text-left sm:grid-cols-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground"
            >
              <span className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-500" />
              {point}
            </li>
          ))}
        </ul>
      </ScrollReveal>

      <ScrollReveal>
        <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create">
            <Button variant="brand" size="xl" className="gap-2">
              Create a Poll
              <IconArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="brand-outline" size="xl">
              See Pricing
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          This page is a work in progress — the poll builder already works
          today.
        </p>
      </ScrollReveal>
    </div>
  );
}
