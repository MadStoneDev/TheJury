"use client";

import { motion } from "motion/react";

interface ReactionPollInputProps {
  emojis: string[];
  selected: string[];
  onToggle: (emoji: string) => void;
  disabled?: boolean;
}

export default function ReactionPollInput({
  emojis,
  selected,
  onToggle,
  disabled,
}: ReactionPollInputProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {emojis.map((emoji) => {
        const isSelected = selected.includes(emoji);

        return (
          <motion.button
            key={emoji}
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.9 }}
            onClick={() => !disabled && onToggle(emoji)}
            disabled={disabled}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl transition-all ${
              isSelected
                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
            } ${disabled ? "opacity-70 cursor-default" : "cursor-pointer"}`}
            aria-label={`React with ${emoji}`}
          >
            <motion.span
              animate={isSelected ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {emoji}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
