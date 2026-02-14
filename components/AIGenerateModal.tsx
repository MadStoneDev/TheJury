"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconSparkles, IconLoader2, IconWand } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface GeneratedQuestion {
  question_text: string;
  question_type: string;
  allow_multiple: boolean;
  options: { text: string }[];
}

interface GeneratedPoll {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

interface AIGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (poll: GeneratedPoll) => void;
}

export default function AIGenerateModal({
  open,
  onOpenChange,
  onApply,
}: AIGenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<GeneratedPoll | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError("");
    setPreview(null);

    try {
      const res = await fetch("/api/ai/generate-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setPreview(data);
    } catch {
      setError("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    onApply(preview);
    onOpenChange(false);
    setPrompt("");
    setPreview(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setPreview(null);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSparkles className="w-5 h-5 text-emerald-500" />
            Generate Poll with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Describe the poll you want to create
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                  placeholder="e.g. Customer satisfaction survey for our new product launch..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {prompt.length}/500
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                variant="brand"
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconWand className="w-4 h-4" />
                    Generate Poll
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {preview.title}
                  </h3>
                  {preview.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {preview.description}
                    </p>
                  )}
                </div>

                {preview.questions.map((q, i) => (
                  <div
                    key={i}
                    className="bg-card/50 rounded-lg p-3 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {preview.questions.length > 1 && (
                        <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          Q{i + 1}
                        </span>
                      )}
                      <p className="text-sm font-medium text-foreground">
                        {q.question_text}
                      </p>
                    </div>
                    {q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {q.options.map((opt, j) => (
                          <span
                            key={j}
                            className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                          >
                            {opt.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApply}
                  variant="brand"
                  className="flex-1 gap-2"
                >
                  <IconSparkles className="w-4 h-4" />
                  Use This Poll
                </Button>
                <Button
                  onClick={() => {
                    setPreview(null);
                    setError("");
                  }}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
