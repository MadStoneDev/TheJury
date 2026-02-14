"use client";

import { motion } from "motion/react";
import { hoverLift, tapScale } from "@/lib/animations";

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverCard({ children, className }: HoverCardProps) {
  return (
    <motion.div
      whileHover={hoverLift}
      whileTap={tapScale}
      className={className}
    >
      {children}
    </motion.div>
  );
}
