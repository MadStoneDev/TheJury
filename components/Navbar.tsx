"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/supabaseHelpers";
import type { User } from "@supabase/supabase-js";
import { IconDashboard, IconPlus, IconPower } from "@tabler/icons-react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success) {
        setUser(null);
        router.push("/");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-neutral-200 fixed top-0 left-0 right-0 z-50">
      <div className="bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-neutral-900 hover:text-emerald-700 transition-colors"
            >
              TheJury
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/create"
                  className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                >
                  Create Poll
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded"></div>
            ) : user ? (
              <>
                <span className="text-sm text-emerald-700">Welcome back!</span>
                <button
                  onClick={handleSignOut}
                  className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="bg-emerald-700 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-neutral-500 hover:text-neutral-900 focus:outline-none focus:text-neutral-900 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}

        <div className="md:hidden">
          <div
            className={`space-y-1 bg-white border-t border-neutral-200 ${
              isMenuOpen ? "max-h-[999px] pt-2 pb-3" : "max-h-0"
            } overflow-hidden z-50 transition-all duration-200`}
          >
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 px-3 py-2 hover:bg-emerald-700 text-neutral-600 hover:text-neutral-50 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <IconDashboard size={20} />
                  Dashboard
                </Link>
                <Link
                  href="/create"
                  className="flex items-center gap-1 px-3 py-2 hover:bg-emerald-700 text-neutral-600 hover:text-neutral-50 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <IconPlus size={20} />
                  Create Poll
                </Link>
              </>
            )}

            <div className="border-t border-neutral-200 pt-4 mt-4">
              {isLoading ? (
                <div className="px-3 py-2">
                  <div className="w-20 h-4 animate-pulse bg-gray-200 rounded"></div>
                </div>
              ) : user ? (
                <>
                  <span className="block px-3 py-2 text-emerald-700 font-bold">
                    Welcome back!
                  </span>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 hover:bg-emerald-700 text-neutral-600 hover:text-neutral-50 font-medium transition-all w-full text-left"
                  >
                    <IconPower size={20} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="block px-3 py-2 bg-emerald-700 hover:bg-emerald-700 text-white rounded-md font-medium mt-2 text-center transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>

          <div
            className={`${
              isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
            } fixed top-0 right-0 bottom-0 left-0 bg-neutral-900/40 transition-all duration-200 -z-10`}
            onClick={() => setIsMenuOpen(false)}
          ></div>
        </div>
      </div>
    </nav>
  );
};
