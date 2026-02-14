"use client";

import { motion } from "motion/react";
import { IconCheck } from "@tabler/icons-react";

interface ImageOption {
  id: string;
  text: string;
  image_url?: string;
}

interface ImageOptionInputProps {
  options: ImageOption[];
  selected: string[];
  onToggle: (optionId: string) => void;
  allowMultiple?: boolean;
  disabled?: boolean;
}

export default function ImageOptionInput({
  options,
  selected,
  onToggle,
  disabled,
}: ImageOptionInputProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);

        return (
          <motion.button
            key={option.id}
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => !disabled && onToggle(option.id)}
            disabled={disabled}
            className={`relative rounded-xl border-2 overflow-hidden transition-all text-left ${
              isSelected
                ? "border-emerald-500 ring-2 ring-emerald-500/20"
                : "border-border hover:border-emerald-500/50"
            } ${disabled ? "opacity-70 cursor-default" : "cursor-pointer"}`}
          >
            {/* Image */}
            {option.image_url ? (
              <div className="aspect-square bg-muted relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={option.image_url}
                  alt={option.text}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-square bg-muted flex items-center justify-center">
                <span className="text-4xl text-muted-foreground/30">📷</span>
              </div>
            )}

            {/* Label */}
            <div className="p-3">
              <span className="text-sm font-medium text-foreground line-clamp-2">
                {option.text}
              </span>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
              >
                <IconCheck className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
