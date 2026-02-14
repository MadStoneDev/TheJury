"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconLock, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPassword } from "@/lib/passwordUtils";

interface PasswordGateProps {
  passwordHash: string;
  pollTitle: string;
  onUnlock: () => void;
}

export default function PasswordGate({
  passwordHash,
  pollTitle,
  onUnlock,
}: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsChecking(true);
    setError("");

    try {
      const hash = await hashPassword(password);
      if (hash === passwordHash) {
        onUnlock();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <IconLock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-xl font-display text-foreground mb-2">
            Password Required
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            This poll is password protected. Enter the password to vote on &ldquo;{pollTitle}&rdquo;.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full gap-2"
              disabled={!password.trim() || isChecking}
            >
              {isChecking ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Unlock Poll"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
