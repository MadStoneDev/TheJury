"use client";

import { EMOJI_PRESETS } from "@/lib/questionTypes";
import { Label } from "@/components/ui/label";

interface ReactionPollConfigProps {
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

export default function ReactionPollConfig({
  settings,
  onChange,
}: ReactionPollConfigProps) {
  const emojis = (settings.emojis as string[]) ?? ["👍", "👎", "❤️", "😂", "😮", "😢"];

  const setEmojis = (newEmojis: string[]) => {
    onChange({ ...settings, emojis: newEmojis });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-xl border border-border">
      <h4 className="text-sm font-semibold text-foreground">
        Reaction Emoji Settings
      </h4>

      {/* Presets */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Quick presets
        </Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EMOJI_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              onClick={() => setEmojis(preset)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                JSON.stringify(emojis) === JSON.stringify(preset)
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : "border-border text-muted-foreground hover:border-emerald-500/50"
              }`}
            >
              <span className="mr-1.5">{preset.slice(0, 2).join("")}</span>
              <span className="capitalize">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current emojis */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Selected emojis ({emojis.length})
        </Label>
        <div className="flex flex-wrap gap-2">
          {emojis.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setEmojis(emojis.filter((_, j) => j !== i))}
              className="w-10 h-10 rounded-lg border border-border hover:border-destructive/50 hover:bg-destructive/5 flex items-center justify-center text-xl transition-all group"
              title="Click to remove"
            >
              <span className="group-hover:opacity-50">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
