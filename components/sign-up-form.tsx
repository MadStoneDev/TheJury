"use client";

import { cn } from "@/lib/utils";
import { checkUsernameAvailable } from "@/lib/supabaseHelpers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { IconCheck, IconX, IconLoader } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const router = useRouter();

  // Debounced username checking
  useEffect(() => {
    const checkUsername = async () => {
      if (!username) {
        setUsernameStatus("idle");
        return;
      }

      // Basic validation
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      if (!usernameRegex.test(username)) {
        setUsernameStatus("invalid");
        return;
      }

      setUsernameStatus("checking");

      try {
        const isAvailable = await checkUsernameAvailable(username);
        setUsernameStatus(isAvailable ? "available" : "taken");
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameStatus("idle");
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <IconLoader size={16} className="animate-spin text-muted-foreground" />;
      case "available":
        return <IconCheck size={16} className="text-emerald-500" />;
      case "taken":
      case "invalid":
        return <IconX size={16} className="text-destructive" />;
      default:
        return null;
    }
  };

  const getUsernameStatusMessage = () => {
    switch (usernameStatus) {
      case "checking":
        return (
          <span className="text-xs text-muted-foreground">
            Checking availability...
          </span>
        );
      case "available":
        return (
          <span className="text-xs text-emerald-500">Username is available!</span>
        );
      case "taken":
        return (
          <span className="text-xs text-destructive">
            Username is already taken
          </span>
        );
      case "invalid":
        return (
          <span className="text-xs text-destructive">
            3-50 characters, letters, numbers, and underscores only
          </span>
        );
      default:
        return (
          <span className="text-xs text-muted-foreground">
            Choose a unique username
          </span>
        );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            username: username, // Pass the input username
          },
        },
      });

      if (error) throw error;

      // Create profile immediately after successful signup
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: username, // Use the form input
          avatar_url: data.user.user_metadata?.avatar_url || null,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      router.push("/auth/sign-up-success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const isFormValid =
    usernameStatus === "available" &&
    email &&
    password &&
    password === repeatPassword;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-display">Sign up</CardTitle>
          <CardDescription>
            Create a new account to start creating polls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="bruce@wayne.enterprises"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="brucewayne"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={cn(
                      "pr-8",
                      usernameStatus === "available" &&
                        "border-emerald-500/50 focus:border-emerald-500",
                      (usernameStatus === "taken" ||
                        usernameStatus === "invalid") &&
                        "border-destructive/50 focus:border-destructive",
                    )}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {getUsernameStatusIcon()}
                  </div>
                </div>
                {getUsernameStatusMessage()}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
                <span className="text-xs text-muted-foreground">
                  At least 6 characters
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className={cn(
                    repeatPassword &&
                      password !== repeatPassword &&
                      "border-destructive/50 focus:border-destructive",
                  )}
                />
                {repeatPassword && password !== repeatPassword && (
                  <span className="text-xs text-destructive">
                    Passwords do not match
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-500 underline-offset-4 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
