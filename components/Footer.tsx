"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/motion";
import { AUDIENCES } from "@/lib/marketing/audiences";

// TODO(placeholder): confirm the registered ABN before launch.
const ABN_PLACEHOLDER = "ABN 00 000 000 000";

export function Footer() {
  return (
    <ScrollReveal>
      <footer className="relative border-t border-border bg-muted/50 dark:bg-slate-950/80">
        <div className="dots-bg absolute inset-0 pointer-events-none opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="text-xl font-display text-foreground hover:text-emerald-500 transition-colors"
              >
                TheJury
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Australian-hosted polls and votes for organisations. No account
                needed to vote.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Create a Poll
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Use cases */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Use cases
              </h4>
              <ul className="space-y-2.5">
                {AUDIENCES.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/for/${a.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {a.navLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} TheJury. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Australian owned and operated · {ABN_PLACEHOLDER} · Made with care
              by{" "}
              <Link
                target="_blank"
                rel="noopener"
                href="https://ravenci.solutions"
                className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
              >
                RAVENCI
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </ScrollReveal>
  );
}
