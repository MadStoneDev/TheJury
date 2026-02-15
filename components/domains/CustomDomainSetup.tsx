"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconWorld,
  IconCheck,
  IconClock,
  IconTrash,
  IconPlus,
  IconCopy,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CustomDomain {
  id: string;
  domain: string;
  verification_token: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function CustomDomainSetup() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("custom_domains")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (err) {
      console.error("Error fetching domains:", err);
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAdd = async () => {
    const domainValue = newDomain.trim().toLowerCase();

    if (!domainValue) {
      toast.error("Domain is required");
      return;
    }

    // Basic domain validation
    const domainPattern = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
    if (!domainPattern.test(domainValue)) {
      toast.error("Please enter a valid domain (e.g. polls.example.com)");
      return;
    }

    setSubmitting(true);

    try {
      const verificationToken = crypto.randomUUID();

      const { error } = await supabase.from("custom_domains").insert({
        domain: domainValue,
        verification_token: verificationToken,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This domain is already registered");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Domain added. Follow the DNS instructions to verify.");
      setNewDomain("");
      setShowForm(false);
      await fetchDomains();
    } catch (err) {
      console.error("Error adding domain:", err);
      toast.error("Failed to add domain");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(domainId);

    try {
      const response = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }

      if (data.verified) {
        toast.success(data.message || "Domain verified!");
        await fetchDomains();
      } else {
        toast.error(data.message || "Verification failed. Check your DNS records.");
      }
    } catch (err) {
      console.error("Error verifying domain:", err);
      toast.error("Failed to verify domain");
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_domains")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDomains((prev) => prev.filter((d) => d.id !== id));
      toast.success("Domain removed");
    } catch (err) {
      console.error("Error deleting domain:", err);
      toast.error("Failed to remove domain");
    }
  };

  const handleCopyToken = async (token: string, domainId: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(domainId);
      toast.success("Token copied!");
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
          <IconWorld size={20} className="text-emerald-500" />
          Custom Domains
        </h3>
        {!showForm && (
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <IconPlus size={14} />
            Add Domain
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Use your own domain for poll links instead of the default TheJury URL.
      </p>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Domain
              </label>
              <Input
                type="text"
                placeholder="polls.yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the domain or subdomain you want to use for your polls.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="brand"
                size="sm"
                onClick={handleAdd}
                disabled={submitting}
                className="gap-1.5"
              >
                <IconPlus size={14} />
                {submitting ? "Adding..." : "Add Domain"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNewDomain("");
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domain list */}
      <div className="space-y-3">
        <AnimatePresence>
          {domains.map((domain) => (
            <motion.div
              key={domain.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {domain.verified ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <IconCheck size={12} className="text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <IconClock size={12} className="text-amber-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground truncate">
                    {domain.domain}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      domain.verified
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {domain.verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!domain.verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(domain.id)}
                      disabled={verifying === domain.id}
                      className="text-xs gap-1.5"
                    >
                      <IconCheck size={12} />
                      {verifying === domain.id ? "Checking..." : "Verify"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(domain.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              </div>

              {/* DNS instructions for unverified domains */}
              {!domain.verified && (
                <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    DNS Verification Required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add a TXT record to your domain to verify ownership:
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground w-12 shrink-0">
                        Host:
                      </span>
                      <code className="flex-1 text-xs font-mono bg-card border border-border rounded px-2 py-1 text-foreground truncate">
                        _thejury-verify.{domain.domain}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground w-12 shrink-0">
                        Value:
                      </span>
                      <code className="flex-1 text-xs font-mono bg-card border border-border rounded px-2 py-1 text-foreground truncate">
                        {domain.verification_token}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToken(
                            domain.verification_token,
                            domain.id,
                          )
                        }
                        className="shrink-0 h-7 w-7 p-0"
                      >
                        {copiedToken === domain.id ? (
                          <IconCheck size={12} />
                        ) : (
                          <IconCopy size={12} />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    DNS changes can take up to 24-48 hours to propagate.
                  </p>
                </div>
              )}

              {domain.verified_at && (
                <p className="text-[10px] text-muted-foreground">
                  Verified on {new Date(domain.verified_at).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {domains.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No custom domains configured yet.
          </p>
        )}
      </div>
    </div>
  );
}
