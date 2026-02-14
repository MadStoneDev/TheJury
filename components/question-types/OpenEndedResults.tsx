"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconMessage } from "@tabler/icons-react";

interface OpenEndedResultsProps {
  data: { responses: string[]; totalResponses: number };
}

export default function OpenEndedResults({ data }: OpenEndedResultsProps) {
  const { responses, totalResponses } = data;
  const [showAll, setShowAll] = useState(false);
  const displayedResponses = showAll ? responses : responses.slice(0, 5);

  if (totalResponses === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <IconMessage className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No responses yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        {totalResponses} {totalResponses === 1 ? "response" : "responses"}
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {displayedResponses.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground"
          >
            {text}
          </motion.div>
        ))}
      </div>

      {responses.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-sm text-emerald-500 hover:text-emerald-400 transition-colors py-2"
        >
          Show all {responses.length} responses
        </button>
      )}
    </div>
  );
}
