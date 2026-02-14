"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconLock, IconSparkles } from "@tabler/icons-react";
import { TIERS, type TierName } from "@/lib/stripe";
import {
  type Feature,
  FEATURE_LABELS,
  FEATURE_DESCRIPTIONS,
} from "@/lib/featureGate";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: Feature;
  targetTier?: TierName;
}

export default function UpgradeModal({
  open,
  onOpenChange,
  feature,
  targetTier = "pro",
}: UpgradeModalProps) {
  const router = useRouter();
  const tier = TIERS[targetTier];
  const label = FEATURE_LABELS[feature];
  const description = FEATURE_DESCRIPTIONS[feature];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <IconLock size={20} className="text-emerald-500" />
            Upgrade to Unlock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <IconSparkles size={20} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </motion.div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Available on the{" "}
              <span className="font-semibold text-emerald-500">
                {tier.name}
              </span>{" "}
              plan
            </p>
            <p className="text-xs text-muted-foreground">
              Starting at A${tier.priceMonthly}/month
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="brand"
              size="lg"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                router.push("/pricing");
              }}
            >
              View Plans
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
