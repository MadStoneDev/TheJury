"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconWebhook,
  IconTrash,
  IconPlus,
  IconCheck,
  IconCopy,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

const ALL_EVENTS = [
  "vote.created",
  "poll.created",
  "poll.updated",
  "poll.deleted",
] as const;

const EVENT_LABELS: Record<string, string> = {
  "vote.created": "Vote Created",
  "poll.created": "Poll Created",
  "poll.updated": "Poll Updated",
  "poll.deleted": "Poll Deleted",
};

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (err) {
      console.error("Error fetching webhooks:", err);
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleAdd = async () => {
    if (!newUrl.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      new URL(newUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setSubmitting(true);

    try {
      const secret = crypto.randomUUID();

      const { error } = await supabase.from("webhooks").insert({
        url: newUrl.trim(),
        events: selectedEvents,
        secret,
        is_active: true,
      });

      if (error) throw error;

      setGeneratedSecret(secret);
      toast.success("Webhook created");
      await fetchWebhooks();
    } catch (err) {
      console.error("Error creating webhook:", err);
      toast.error("Failed to create webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;

      setWebhooks((prev) => prev.filter((wh) => wh.id !== id));
      toast.success("Webhook deleted");
    } catch (err) {
      console.error("Error deleting webhook:", err);
      toast.error("Failed to delete webhook");
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("webhooks")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      setWebhooks((prev) =>
        prev.map((wh) =>
          wh.id === id ? { ...wh, is_active: !currentState } : wh,
        ),
      );
      toast.success(currentState ? "Webhook disabled" : "Webhook enabled");
    } catch (err) {
      console.error("Error toggling webhook:", err);
      toast.error("Failed to update webhook");
    }
  };

  const handleCopySecret = async () => {
    if (!generatedSecret) return;
    try {
      await navigator.clipboard.writeText(generatedSecret);
      setSecretCopied(true);
      toast.success("Secret copied!");
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      toast.error("Failed to copy secret");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setNewUrl("");
    setSelectedEvents([]);
    setGeneratedSecret(null);
    setSecretCopied(false);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
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
          <IconWebhook size={20} className="text-emerald-500" />
          Webhooks
        </h3>
        {!showForm && (
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <IconPlus size={14} />
            Add Webhook
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Receive real-time HTTP notifications when events occur on your polls.
      </p>

      {/* Secret display (shown once after creation) */}
      <AnimatePresence>
        {generatedSecret && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border-2 border-amber-500/30 bg-amber-500/5 p-4 space-y-2"
          >
            <p className="text-sm font-medium text-amber-400">
              Webhook Secret (shown once)
            </p>
            <p className="text-xs text-muted-foreground">
              Save this secret -- it will not be shown again. Use it to verify
              webhook signatures.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-xs font-mono bg-muted border border-border rounded-lg truncate text-foreground">
                {generatedSecret}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySecret}
                className="gap-1.5 shrink-0"
              >
                {secretCopied ? (
                  <IconCheck size={14} />
                ) : (
                  <IconCopy size={14} />
                )}
                {secretCopied ? "Copied" : "Copy"}
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

      {/* Add form */}
      <AnimatePresence>
        {showForm && !generatedSecret && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-muted/30 p-4 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Endpoint URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/webhook"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Events
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_EVENTS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedEvents.includes(event)
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedEvents.includes(event)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedEvents.includes(event) && (
                        <IconCheck size={12} className="text-white" />
                      )}
                    </div>
                    {EVENT_LABELS[event]}
                  </button>
                ))}
              </div>
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
                {submitting ? "Creating..." : "Create Webhook"}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhook list */}
      <div className="space-y-2">
        <AnimatePresence>
          {webhooks.map((webhook) => (
            <motion.div
              key={webhook.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      webhook.is_active ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  />
                  <span className="text-sm font-mono text-foreground truncate">
                    {webhook.url}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(webhook.id, webhook.is_active)}
                    className="text-xs"
                  >
                    {webhook.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded"
                  >
                    {event}
                  </span>
                ))}
              </div>

              {webhook.last_triggered_at && (
                <p className="text-[10px] text-muted-foreground">
                  Last triggered:{" "}
                  {new Date(webhook.last_triggered_at).toLocaleString()}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {webhooks.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No webhooks configured yet.
          </p>
        )}
      </div>
    </div>
  );
}
