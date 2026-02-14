"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconPlus, IconTrash, IconFlask } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ABVariant {
  id: string;
  name: string;
  questionText: string;
  weight: number;
}

interface ABTestSetupProps {
  variants: ABVariant[];
  onChange: (variants: ABVariant[]) => void;
  baseQuestionText: string;
}

export default function ABTestSetup({
  variants,
  onChange,
  baseQuestionText,
}: ABTestSetupProps) {
  const [expanded, setExpanded] = useState(variants.length > 0);

  const addVariant = () => {
    const label = String.fromCharCode(65 + variants.length); // A, B, C...
    const newVariant: ABVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${label}`,
      questionText: baseQuestionText,
      weight: Math.floor(100 / (variants.length + 1)),
    };

    // Rebalance weights
    const totalVariants = variants.length + 1;
    const weight = Math.floor(100 / totalVariants);
    const updated = variants.map((v) => ({ ...v, weight }));
    updated.push({ ...newVariant, weight });

    // Give remainder to first variant
    const remainder = 100 - weight * totalVariants;
    if (updated.length > 0) {
      updated[0].weight += remainder;
    }

    onChange(updated);
  };

  const removeVariant = (id: string) => {
    const filtered = variants.filter((v) => v.id !== id);
    if (filtered.length > 0) {
      const weight = Math.floor(100 / filtered.length);
      const balanced = filtered.map((v) => ({ ...v, weight }));
      balanced[0].weight += 100 - weight * filtered.length;
      onChange(balanced);
    } else {
      onChange([]);
    }
  };

  const updateVariant = (id: string, updates: Partial<ABVariant>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          if (variants.length === 0) {
            // Initialize with 2 variants
            const weightA = 50;
            const weightB = 50;
            onChange([
              {
                id: `variant-${Date.now()}-a`,
                name: "Variant A",
                questionText: baseQuestionText,
                weight: weightA,
              },
              {
                id: `variant-${Date.now()}-b`,
                name: "Variant B",
                questionText: baseQuestionText || "",
                weight: weightB,
              },
            ]);
          }
        }}
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-500/30 rounded-xl text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-colors text-sm font-medium"
      >
        <IconFlask size={16} />
        Set Up A/B Test
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <IconFlask size={16} className="text-purple-400" />
          A/B Test Variants
        </h4>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            onChange([]);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Remove A/B Test
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Each voter is randomly shown one variant. Compare which question wording performs better.
      </p>

      <AnimatePresence>
        {variants.map((variant) => (
          <motion.div
            key={variant.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-card p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                  {variant.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {variant.weight}% traffic
                </span>
              </div>
              {variants.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeVariant(variant.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <IconTrash size={14} />
                </button>
              )}
            </div>
            <Input
              type="text"
              value={variant.questionText}
              onChange={(e) =>
                updateVariant(variant.id, { questionText: e.target.value })
              }
              placeholder="Alternative question wording..."
              className="text-sm"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {variants.length < 4 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          className="w-full gap-1.5 text-purple-400 border-purple-500/30 hover:border-purple-500/50"
        >
          <IconPlus size={14} />
          Add Variant
        </Button>
      )}

      {/* Weight slider */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Traffic Split</span>
        </div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden">
          {variants.map((v, i) => {
            const colors = ["bg-purple-500", "bg-blue-500", "bg-teal-500", "bg-amber-500"];
            return (
              <div
                key={v.id}
                className={`${colors[i % colors.length]} transition-all`}
                style={{ width: `${v.weight}%` }}
                title={`${v.name}: ${v.weight}%`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          {variants.map((v) => (
            <span key={v.id} className="text-[10px] text-muted-foreground">
              {v.name} ({v.weight}%)
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
