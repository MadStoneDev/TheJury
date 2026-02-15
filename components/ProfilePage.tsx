"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { IconCheck, IconLoader2, IconMail, IconCalendar, IconChartBar } from "@tabler/icons-react";
import {
  updateProfile,
  checkUsernameAvailable,
} from "@/lib/supabaseHelpers";
import { profileUpdateSchema } from "@/lib/validations";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import type { Profile } from "@/lib/supabaseHelpers";
import type { TierName } from "@/lib/stripe";
import { formatDateLong } from "@/lib/dateUtils";
import { canUseFeature } from "@/lib/featureGate";
import WebhookManager from "@/components/webhooks/WebhookManager";
import APIKeyManager from "@/components/api/APIKeyManager";
import CustomDomainSetup from "@/components/domains/CustomDomainSetup";

interface ProfilePageProps {
  profile: Profile;
  userId: string;
  email: string;
  memberSince: string;
  pollCount: number;
  subscriptionTier: TierName;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

const tierBadgeStyles: Record<TierName, string> = {
  free: "bg-muted text-muted-foreground border border-border",
  pro: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
  team: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
};

export default function ProfilePage({
  profile,
  userId,
  email,
  memberSince,
  pollCount,
  subscriptionTier,
  subscriptionStatus,
  currentPeriodEnd,
}: ProfilePageProps) {
  const [username, setUsername] = useState(profile.username);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameError, setUsernameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const checkUsername = useCallback(
    async (value: string) => {
      if (value === profile.username) {
        setUsernameStatus("idle");
        setUsernameError("");
        return;
      }

      const result = profileUpdateSchema.safeParse({ username: value });
      if (!result.success) {
        setUsernameStatus("invalid");
        setUsernameError(result.error.issues[0].message);
        return;
      }

      setUsernameStatus("checking");
      setUsernameError("");

      const available = await checkUsernameAvailable(value, userId);

      if (available) {
        setUsernameStatus("available");
        setUsernameError("");
      } else {
        setUsernameStatus("taken");
        setUsernameError("Username is already taken");
      }
    },
    [profile.username, userId],
  );

  const handleSave = async () => {
    if (username === profile.username) {
      toast.info("No changes to save");
      return;
    }

    if (usernameStatus !== "available") {
      toast.error("Please choose an available username");
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateProfile(userId, { username });
      if (success) {
        toast.success("Profile updated!");
        setUsernameStatus("idle");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const formatDate = formatDateLong;

  const initial = (profile.username || email || "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <StaggerItem className="lg:w-80 shrink-0">
            <div className="rounded-2xl bg-card border border-border p-8 flex flex-col items-center text-center">
              {/* Avatar with gradient ring */}
              <div className="relative mb-5">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 p-[3px]">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    <span className="text-3xl font-bold gradient-text">
                      {initial}
                    </span>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-1">
                {profile.username}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{email}</p>

              {/* Tier Badge */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 ${tierBadgeStyles[subscriptionTier]}`}
              >
                {subscriptionTier}
              </span>

              {/* Quick Stats */}
              <div className="w-full border-t border-border pt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <IconChartBar size={18} className="text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Polls Created</p>
                    <p className="text-foreground font-semibold">{pollCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <IconCalendar size={18} className="text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-foreground font-semibold">
                      {formatDate(memberSince)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <IconMail size={18} className="text-emerald-500" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground font-semibold truncate">
                      {email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Page Title */}
            <StaggerItem>
              <h1 className="text-3xl font-display text-foreground">
                Your Profile
              </h1>
            </StaggerItem>

            {/* Profile Info */}
            <StaggerItem>
              <div className="rounded-2xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Profile Info
                </h2>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Username
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setUsernameStatus("idle");
                          setUsernameError("");
                        }}
                        onBlur={() => checkUsername(username)}
                        className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          usernameStatus === "taken" ||
                          usernameStatus === "invalid"
                            ? "border-destructive"
                            : usernameStatus === "available"
                              ? "border-emerald-500"
                              : "border-border"
                        }`}
                      />
                      {usernameStatus === "checking" && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <IconLoader2
                            size={18}
                            className="animate-spin text-muted-foreground"
                          />
                        </div>
                      )}
                      {usernameStatus === "available" && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <IconCheck size={18} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="brand"
                      onClick={handleSave}
                      disabled={
                        isSaving ||
                        username === profile.username ||
                        usernameStatus === "taken" ||
                        usernameStatus === "invalid" ||
                        usernameStatus === "checking"
                      }
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  {usernameError && (
                    <p className="mt-1 text-sm text-destructive">
                      {usernameError}
                    </p>
                  )}
                  {usernameStatus === "available" && (
                    <p className="mt-1 text-sm text-emerald-500">
                      Username is available
                    </p>
                  )}
                </div>
              </div>
            </StaggerItem>

            {/* Subscription */}
            <StaggerItem>
              <div className="rounded-2xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Subscription
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Current Plan
                    </label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${tierBadgeStyles[subscriptionTier]}`}
                      >
                        {subscriptionTier}
                      </span>
                      {subscriptionStatus &&
                        subscriptionStatus !== "active" && (
                          <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded-full text-xs font-medium">
                            {subscriptionStatus}
                          </span>
                        )}
                    </div>
                  </div>

                  {currentPeriodEnd && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Current Period Ends
                      </label>
                      <p className="text-foreground font-medium">
                        {formatDate(currentPeriodEnd)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-5 mt-5 border-t border-border">
                  {subscriptionTier === "free" ? (
                    <Button variant="brand" asChild>
                      <Link href="/pricing">Upgrade</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="brand"
                      onClick={handleManageBilling}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading ? "Loading..." : "Manage Billing"}
                    </Button>
                  )}
                </div>
              </div>
            </StaggerItem>

            {/* Account Info */}
            <StaggerItem>
              <div className="rounded-2xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Account Info
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </label>
                    <p className="text-foreground">{email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Member Since
                    </label>
                    <p className="text-foreground">{formatDate(memberSince)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Polls Created
                    </label>
                    <p className="text-foreground">{pollCount}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Webhooks (Team) */}
            {canUseFeature(subscriptionTier, "webhooks") && (
              <StaggerItem>
                <div className="rounded-2xl bg-card border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    Webhooks
                  </h2>
                  <WebhookManager />
                </div>
              </StaggerItem>
            )}

            {/* API Keys (Team) */}
            {canUseFeature(subscriptionTier, "apiAccess") && (
              <StaggerItem>
                <div className="rounded-2xl bg-card border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    API Keys
                  </h2>
                  <APIKeyManager />
                </div>
              </StaggerItem>
            )}

            {/* Custom Domains (Team) */}
            {canUseFeature(subscriptionTier, "customDomains") && (
              <StaggerItem>
                <div className="rounded-2xl bg-card border border-border p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    Custom Domains
                  </h2>
                  <CustomDomainSetup />
                </div>
              </StaggerItem>
            )}
          </div>
        </StaggerContainer>
      </div>
    </div>
  );
}
