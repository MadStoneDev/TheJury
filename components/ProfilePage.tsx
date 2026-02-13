"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import {
  updateProfile,
  checkUsernameAvailable,
  getCurrentUser,
} from "@/lib/supabaseHelpers";
import { profileUpdateSchema } from "@/lib/validations";
import { toast } from "sonner";
import type { Profile } from "@/lib/supabaseHelpers";
import type { TierName } from "@/lib/stripe";

interface ProfilePageProps {
  profile: Profile;
  email: string;
  memberSince: string;
  pollCount: number;
  subscriptionTier: TierName;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

export default function ProfilePage({
  profile,
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

      const user = await getCurrentUser();
      const available = await checkUsernameAvailable(value, user?.id);

      if (available) {
        setUsernameStatus("available");
        setUsernameError("");
      } else {
        setUsernameStatus("taken");
        setUsernameError("Username is already taken");
      }
    },
    [profile.username],
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
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const success = await updateProfile(user.id, { username });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const initial = (profile.username || email || "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 sm:py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Your Profile
          </h1>

          {/* Profile Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Profile Info
            </h2>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center text-2xl font-bold">
                {initial}
              </div>
              <div>
                <p className="font-medium text-gray-900">{profile.username}</p>
                <p className="text-sm text-gray-500">{email}</p>
              </div>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      usernameStatus === "taken" || usernameStatus === "invalid"
                        ? "border-red-300"
                        : usernameStatus === "available"
                          ? "border-emerald-300"
                          : "border-gray-300"
                    }`}
                  />
                  {usernameStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <IconLoader2
                        size={18}
                        className="animate-spin text-gray-400"
                      />
                    </div>
                  )}
                  {usernameStatus === "available" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <IconCheck size={18} className="text-emerald-600" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={
                    isSaving ||
                    username === profile.username ||
                    usernameStatus === "taken" ||
                    usernameStatus === "invalid" ||
                    usernameStatus === "checking"
                  }
                  className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-600">{usernameError}</p>
              )}
              {usernameStatus === "available" && (
                <p className="mt-1 text-sm text-emerald-600">
                  Username is available
                </p>
              )}
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Subscription
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Current Plan
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium capitalize">
                    {subscriptionTier}
                  </span>
                  {subscriptionStatus && subscriptionStatus !== "active" && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {subscriptionStatus}
                    </span>
                  )}
                </div>
              </div>

              {currentPeriodEnd && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Period Ends
                  </label>
                  <p className="text-gray-900">
                    {formatDate(currentPeriodEnd)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {subscriptionTier === "free" ? (
                  <Link
                    href="/pricing"
                    className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    Upgrade
                  </Link>
                ) : (
                  <button
                    onClick={handleManageBilling}
                    disabled={isPortalLoading}
                    className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    {isPortalLoading ? "Loading..." : "Manage Billing"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Account Info
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">{formatDate(memberSince)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Polls Created
                </label>
                <p className="text-gray-900">{pollCount}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
