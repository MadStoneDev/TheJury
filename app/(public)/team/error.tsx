"use client";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-display text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">Failed to load team page.</p>
        <Button onClick={reset} variant="brand">Try Again</Button>
      </div>
    </div>
  );
}
