"use client";

import Link from "next/link";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="rounded-2xl border bg-card p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-destructive">!</span>
          </div>
          <h1 className="text-2xl font-display text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">
            {error.message || "Failed to load the poll form. Please try again."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="brand" className="gap-2">
              <IconRefresh size={18} />
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <IconArrowLeft size={18} />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
