"use client";

import { motion } from "motion/react";
import { Textarea } from "@/components/ui/textarea";

interface OpenEndedInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export default function OpenEndedInput({
  value,
  onChange,
  disabled,
  maxLength = 2000,
}: OpenEndedInputProps) {
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Type your response here..."
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        rows={4}
        className="resize-none"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between text-xs text-muted-foreground"
      >
        <span>
          {value.length > 0
            ? `${value.length} character${value.length !== 1 ? "s" : ""}`
            : ""}
        </span>
        <span>
          {value.length}/{maxLength}
        </span>
      </motion.div>
    </div>
  );
}
