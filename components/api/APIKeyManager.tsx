"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconKey,
  IconTrash,
  IconPlus,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const ALL_SCOPES = [
  "polls:read",
  "polls:write",
  "results:read",
] as const;

const SCOPE_LABELS: Record<string, string> = {
  "polls:read": "Read Polls",
  "polls:write": "Create/Update Polls",
  "results:read": "Read Results",
};

/**
 * Generate an API key client-side.
 * Returns the raw key, a display prefix, and the SHA-256 hash (to store in DB).
 */
async function generateApiKeyClient(): Promise<{
  key: string;
  prefix: string;
  hash: string;
}> {
  // Generate 16 random bytes -> 32 hex chars
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const key = `jury_${raw}`;
  const prefix = key.substring(0, 12); // "jury_" + first 7 hex chars

  // Hash with SHA-256 using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return { key, prefix, hash };
}

export default function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "polls:read",
    "results:read",
  ]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, scopes, last_used_at, expires_at, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err) {
      console.error("Error fetching API keys:", err);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }

    setSubmitting(true);

    try {
      const { key, prefix, hash } = await generateApiKeyClient();

      const { error } = await supabase.from("api_keys").insert({
        name: newName.trim(),
        key_hash: hash,
        key_prefix: prefix,
        scopes: selectedScopes,
      });

      if (error) throw error;

      setGeneratedKey(key);
      toast.success("API key created");
      await fetchApiKeys();
    } catch (err) {
      console.error("Error creating API key:", err);
      toast.error("Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;

      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key deleted");
    } catch (err) {
      console.error("Error deleting API key:", err);
      toast.error("Failed to delete API key");
    }
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      setKeyCopied(true);
      toast.success("API key copied!");
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      toast.error("Failed to copy key");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setNewName("");
    setSelectedScopes(["polls:read", "results:read"]);
    setGeneratedKey(null);
    setKeyCopied(false);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope],
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
          <IconKey size={20} className="text-emerald-500" />
          API Keys
        </h3>
        {!showForm && (
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <IconPlus size={14} />
            Create API Key
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Use API keys to authenticate requests to the TheJury public API.
      </p>

      {/* Generated key display (shown once) */}
      <AnimatePresence>
        {generatedKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border-2 border-amber-500/30 bg-amber-500/5 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <IconAlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-400">
                This key won&apos;t be shown again
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy and store this key securely. You will not be able to see it
              again after dismissing.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-xs font-mono bg-muted border border-border rounded-lg truncate text-foreground select-all">
                {generatedKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="gap-1.5 shrink-0"
              >
                {keyCopied ? (
                  <IconCheck size={14} />
                ) : (
                  <IconCopy size={14} />
                )}
                {keyCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="text-xs"
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create form */}
      <AnimatePresence>
        {showForm && !generatedKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Key Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Production App"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Scopes
              </label>
              <div className="space-y-2">
                {ALL_SCOPES.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                      selectedScopes.includes(scope)
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedScopes.includes(scope)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedScopes.includes(scope) && (
                        <IconCheck size={12} className="text-white" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{SCOPE_LABELS[scope]}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {scope}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="brand"
                size="sm"
                onClick={handleCreate}
                disabled={submitting}
                className="gap-1.5"
              >
                <IconPlus size={14} />
                {submitting ? "Creating..." : "Generate Key"}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API key list */}
      <div className="space-y-2">
        <AnimatePresence>
          {apiKeys.map((apiKey) => (
            <motion.div
              key={apiKey.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <IconKey size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {apiKey.name}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {apiKey.key_prefix}...
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(apiKey.id)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <IconTrash size={14} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {apiKey.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded"
                  >
                    {scope}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>
                  Created: {new Date(apiKey.created_at).toLocaleDateString()}
                </span>
                {apiKey.last_used_at && (
                  <span>
                    Last used:{" "}
                    {new Date(apiKey.last_used_at).toLocaleDateString()}
                  </span>
                )}
                {apiKey.expires_at && (
                  <span>
                    Expires:{" "}
                    {new Date(apiKey.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {apiKeys.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No API keys created yet.
          </p>
        )}
      </div>
    </div>
  );
}
