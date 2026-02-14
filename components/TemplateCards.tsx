"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconLock, IconArrowRight } from "@tabler/icons-react";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PollTemplate,
  type TemplateCategory,
} from "@/lib/templates";
import type { TierName } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import Link from "next/link";

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

  const filteredTemplates =
    selectedCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const tierOrder: TierName[] = ["free", "pro", "team"];

  const isLocked = (template: PollTemplate): boolean => {
    return tierOrder.indexOf(template.minTier) > tierOrder.indexOf(userTier);
  };

  const tierBadge = (tier: TierName) => {
    if (tier === "free") return null;
    return (
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
          tier === "pro"
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-purple-500/10 text-purple-500"
        }`}
      >
        {tier}
      </span>
    );
  };

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === cat.value
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template, i) => {
          const locked = isLocked(template);

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border bg-card p-5 transition-all ${
                locked
                  ? "border-border opacity-70"
                  : "border-border hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex items-center gap-1.5">
                  {tierBadge(template.minTier)}
                  {locked && (
                    <IconLock size={14} className="text-muted-foreground" />
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {template.questions.length}{" "}
                  {template.questions.length === 1 ? "question" : "questions"}
                </span>

                {locked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeModalOpen(true)}
                    className="gap-1 text-xs"
                  >
                    <IconLock size={12} />
                    Unlock
                  </Button>
                ) : isLoggedIn ? (
                  <Link href={`/create?template=${template.id}`}>
                    <Button
                      variant="brand"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      Use Template
                      <IconArrowRight size={12} />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button
                      variant="brand"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      Sign in to use
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
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
