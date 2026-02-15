"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

interface LiveVoteCounterProps {
  count: number;
}

export default function LiveVoteCounter({ count }: LiveVoteCounterProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(count);
  }, [count, spring]);

  return (
    <div className="text-center">
      <motion.div className="text-6xl font-bold text-white tabular-nums">
        <motion.span>{display}</motion.span>
      </motion.div>
      <p className="text-lg text-white/60 mt-1">
        {count === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
