"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconStar, IconStarFilled } from "@tabler/icons-react";

interface RatingScaleInputProps {
  settings: Record<string, unknown>;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function RatingScaleInput({
  settings,
  value,
  onChange,
  disabled,
}: RatingScaleInputProps) {
  const min = (settings.min as number) ?? 1;
  const max = (settings.max as number) ?? 5;
  const labels = (settings.labels as Record<string, string>) ?? {};
  const [hovered, setHovered] = useState<number | null>(null);

  const range: number[] = [];
  for (let i = min; i <= max; i++) range.push(i);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1 sm:gap-2">
        {range.map((n) => {
          const isFilled = n <= (hovered ?? value ?? 0);
          return (
            <motion.button
              key={n}
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => !disabled && setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => !disabled && onChange(n)}
              disabled={disabled}
              className={`p-1 sm:p-1.5 transition-colors ${
                disabled ? "cursor-default" : "cursor-pointer"
              }`}
              aria-label={`Rate ${n} out of ${max}`}
            >
              {isFilled ? (
                <IconStarFilled className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 drop-shadow-sm" />
              ) : (
                <IconStar className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/40" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Labels */}
      {(labels[String(min)] || labels[String(max)]) && (
        <div className="flex justify-between w-full max-w-xs text-xs text-muted-foreground">
          <span>{labels[String(min)] || ""}</span>
          <span>{labels[String(max)] || ""}</span>
        </div>
      )}

      {value !== null && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-emerald-500 font-medium"
        >
          You rated: {value} / {max}
        </motion.p>
      )}
    </div>
  );
}
