"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconPalette, IconTypography } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EmbedTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
}

export const DEFAULT_EMBED_THEME: EmbedTheme = {
  primaryColor: "#10b981",
  backgroundColor: "#0f172a",
  textColor: "#f8fafc",
  borderRadius: 12,
  fontFamily: "Outfit",
};

const AVAILABLE_FONTS = [
  "Outfit",
  "Inter",
  "DM Sans",
  "Roboto",
  "System Default",
] as const;

const FONT_CSS_MAP: Record<string, string> = {
  Outfit: "'Outfit', sans-serif",
  Inter: "'Inter', sans-serif",
  "DM Sans": "'DM Sans', sans-serif",
  Roboto: "'Roboto', sans-serif",
  "System Default":
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

interface EmbedThemeEditorProps {
  theme: EmbedTheme;
  onChange: (theme: EmbedTheme) => void;
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm cursor-pointer transition-shadow hover:shadow-md"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {label}
        </label>
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") {
              onChange(v);
            }
          }}
          onBlur={(e) => {
            const v = e.target.value;
            if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
              onChange(value);
            }
          }}
          className="h-8 font-mono text-xs uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export default function EmbedThemeEditor({
  theme,
  onChange,
}: EmbedThemeEditorProps) {
  const updateField = useCallback(
    <K extends keyof EmbedTheme>(key: K, value: EmbedTheme[K]) => {
      onChange({ ...theme, [key]: value });
    },
    [theme, onChange]
  );

  const handleReset = useCallback(() => {
    onChange({ ...DEFAULT_EMBED_THEME });
  }, [onChange]);

  const isDefault =
    theme.primaryColor === DEFAULT_EMBED_THEME.primaryColor &&
    theme.backgroundColor === DEFAULT_EMBED_THEME.backgroundColor &&
    theme.textColor === DEFAULT_EMBED_THEME.textColor &&
    theme.borderRadius === DEFAULT_EMBED_THEME.borderRadius &&
    theme.fontFamily === DEFAULT_EMBED_THEME.fontFamily;

  const mockOptions = [
    { label: "Option A", percent: 60 },
    { label: "Option B", percent: 30 },
    { label: "Option C", percent: 10 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <IconPalette size={20} className="text-emerald-500" />
          <h3 className="text-base font-semibold text-foreground font-display">
            Embed Theme
          </h3>
        </div>
        <AnimatePresence>
          {!isDefault && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset to defaults
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-border">
        {/* Controls Panel */}
        <div className="p-6 space-y-6">
          {/* Colors Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <IconPalette size={16} className="text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">Colors</h4>
            </div>
            <div className="space-y-4">
              <ColorInput
                label="Primary / Accent"
                value={theme.primaryColor}
                onChange={(v) => updateField("primaryColor", v)}
              />
              <ColorInput
                label="Background"
                value={theme.backgroundColor}
                onChange={(v) => updateField("backgroundColor", v)}
              />
              <ColorInput
                label="Text"
                value={theme.textColor}
                onChange={(v) => updateField("textColor", v)}
              />
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 flex items-center justify-between">
              <span>Border Radius</span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                {theme.borderRadius}px
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={theme.borderRadius}
              onChange={(e) =>
                updateField("borderRadius", Number(e.target.value))
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-emerald-500
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow hover:[&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">0px</span>
              <span className="text-[10px] text-muted-foreground">24px</span>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <IconTypography size={16} className="text-muted-foreground" />
              <label className="text-sm font-medium text-foreground">
                Font Family
              </label>
            </div>
            <Select
              value={theme.fontFamily}
              onValueChange={(v) => updateField("fontFamily", v)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span
                      style={{
                        fontFamily:
                          font === "System Default"
                            ? undefined
                            : FONT_CSS_MAP[font],
                      }}
                    >
                      {font}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="p-6 bg-muted/30">
          <h4 className="text-sm font-medium text-foreground mb-4">
            Live Preview
          </h4>
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border border-border shadow-lg"
            style={{
              backgroundColor: theme.backgroundColor,
              borderRadius: `${theme.borderRadius}px`,
              fontFamily: FONT_CSS_MAP[theme.fontFamily] || FONT_CSS_MAP["Outfit"],
            }}
          >
            {/* Mock Poll Header */}
            <div className="p-5">
              <motion.h5
                layout="position"
                className="text-base font-semibold mb-1"
                style={{ color: theme.textColor }}
              >
                What is your favourite framework?
              </motion.h5>
              <p
                className="text-xs mb-4 opacity-60"
                style={{ color: theme.textColor }}
              >
                12 votes
              </p>

              {/* Mock Options */}
              <div className="space-y-2.5">
                {mockOptions.map((option) => (
                  <div key={option.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-sm"
                        style={{ color: theme.textColor }}
                      >
                        {option.label}
                      </span>
                      <span
                        className="text-xs font-medium opacity-70"
                        style={{ color: theme.textColor }}
                      >
                        {option.percent}%
                      </span>
                    </div>
                    <div
                      className="w-full h-2 overflow-hidden"
                      style={{
                        backgroundColor: `${theme.primaryColor}20`,
                        borderRadius: `${Math.max(theme.borderRadius / 3, 2)}px`,
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${option.percent}%` }}
                        transition={{
                          duration: 0.6,
                          ease: "easeOut",
                          delay: 0.2,
                        }}
                        className="h-full"
                        style={{
                          backgroundColor: theme.primaryColor,
                          borderRadius: `${Math.max(theme.borderRadius / 3, 2)}px`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mock Vote Button */}
              <motion.div
                layout="position"
                className="mt-4 w-full py-2 text-center text-sm font-medium cursor-default"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: "#ffffff",
                  borderRadius: `${Math.max(theme.borderRadius / 2, 4)}px`,
                }}
              >
                Vote
              </motion.div>
            </div>

            {/* Mock Footer */}
            <div
              className="px-5 py-2.5 text-center border-t"
              style={{
                borderColor: `${theme.textColor}15`,
              }}
            >
              <span
                className="text-[10px] opacity-40"
                style={{ color: theme.textColor }}
              >
                Powered by TheJury
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
