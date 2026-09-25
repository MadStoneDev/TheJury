"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  Gavel,
  Users,
  Church,
  ClipboardList,
  MessageSquare,
  Landmark,
  BarChart3,
  Star,
  Calendar,
  Presentation,
  ListChecks,
  Smile,
  type LucideIcon,
} from "lucide-react";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PollTemplate,
  type TemplateCategory,
} from "@/lib/templates";
import type { TierName } from "@/lib/stripe";
import { IconTile } from "@/components/design/IconTile";
import UpgradeModal from "@/components/UpgradeModal";

const ICONS: Record<string, LucideIcon> = {
  gavel: Gavel,
  users: Users,
  church: Church,
  clipboard: ClipboardList,
  "message-square": MessageSquare,
  landmark: Landmark,
  "bar-chart": BarChart3,
  star: Star,
  calendar: Calendar,
  presentation: Presentation,
  "list-checks": ListChecks,
};

interface TemplateCardsProps {
  userTier: TierName;
  isLoggedIn: boolean;
}

export default function TemplateCards({
  userTier,
  isLoggedIn,
}: TemplateCardsProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | "all"
  >("all");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const filtered =
    selectedCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const tierOrder: TierName[] = ["free", "pro", "team"];
  const isLocked = (t: PollTemplate) =>
    tierOrder.indexOf(t.minTier) > tierOrder.indexOf(userTier);

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
      active
        ? "bg-jury-emerald text-jury-on-emerald"
        : "border border-jury-border-strong text-jury-muted hover:text-jury-text"
    }`;

  return (
    <>
      {/* Category pills */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button onClick={() => setSelectedCategory("all")} className={pill(selectedCategory === "all")}>
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={pill(selectedCategory === cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const locked = isLocked(t);
          const Icon = ICONS[t.icon] ?? Smile;
          return (
            <div
              key={t.id}
              className={`flex min-h-[210px] flex-col rounded-xl border bg-jury-surface p-6 transition ${
                locked ? "border-jury-border opacity-80" : "border-jury-border hover:border-white/[0.12]"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <IconTile icon={Icon} />
                <div className="flex items-center gap-1.5">
                  {t.minTier === "pro" && (
                    <span className="rounded bg-jury-emerald-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-jury-emerald">
                      Pro
                    </span>
                  )}
                  {t.minTier === "team" && (
                    <span className="rounded bg-jury-input px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-jury-muted">
                      Team
                    </span>
                  )}
                  {locked && <Lock size={14} className="text-jury-dim" />}
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-jury-text">{t.name}</h3>
              <p className="mt-1 line-clamp-2 text-[14px] text-jury-muted">{t.description}</p>

              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-[13px] text-jury-dim">
                  {t.audience} · {t.questions.length}{" "}
                  {t.questions.length === 1 ? "question" : "questions"}
                </span>
                {locked ? (
                  <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-jury-border-strong px-3.5 py-1.5 text-[13px] font-medium text-jury-body transition hover:border-white/25"
                  >
                    <Lock size={13} /> Unlock
                  </button>
                ) : isLoggedIn ? (
                  <Link
                    href={`/create?template=${t.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-jury-emerald px-3.5 py-1.5 text-[13px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
                  >
                    Use template <ArrowRight size={13} />
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center rounded-full bg-jury-emerald px-3.5 py-1.5 text-[13px] font-semibold text-jury-on-emerald transition hover:bg-jury-emerald-hi"
                  >
                    Sign in to use
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-jury-muted">
          No templates in this category yet.
        </div>
      )}

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature="templates"
      />
    </>
  );
}
