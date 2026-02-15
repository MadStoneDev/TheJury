"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { getCurrentUser, signOut, getProfile } from "@/lib/supabaseHelpers";
import type { User } from "@supabase/supabase-js";
import {
  IconCurrencyDollar,
  IconDashboard,
  IconTemplate,
  IconMenu2,
  IconMoon,
  IconPlus,
  IconPower,
  IconSun,
  IconUser,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const profile = await getProfile(currentUser.id);
          if (profile?.subscription_tier) {
            setUserTier(profile.subscription_tier);
          }
        }
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

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/pricing", label: "Pricing", icon: IconCurrencyDollar, show: true },
    { href: "/templates", label: "Templates", icon: IconTemplate, show: true },
    { href: "/dashboard", label: "Dashboard", icon: IconDashboard, show: !!user },
    { href: "/create", label: "Create Poll", icon: IconPlus, show: !!user },
    { href: "/team", label: "Team", icon: IconUsersGroup, show: !!user && userTier === "team" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/80 border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-display text-foreground hover:text-emerald-500 transition-colors duration-200"
          >
            TheJury
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive(link.href)
                      ? "text-emerald-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full" />
                  )}
                </Link>
              ))}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <IconSun size={18} />
                ) : (
                  <IconMoon size={18} />
                )}
              </button>
            )}

            {isLoading ? (
              <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className={`flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors ${
                    isActive("/profile") ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Sign out"
                >
                  <IconPower size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button variant="brand" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <IconSun size={18} />
                ) : (
                  <IconMoon size={18} />
                )}
              </button>
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Open menu"
                >
                  <IconMenu2 size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl text-left">
                    TheJury
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 mt-6">
                  {navLinks
                    .filter((l) => l.show)
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setSheetOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive(link.href)
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <link.icon size={20} />
                        {link.label}
                      </Link>
                    ))}

                  <div className="my-3 h-px bg-border" />

                  {isLoading ? (
                    <div className="px-3 py-2">
                      <div className="w-20 h-4 animate-pulse bg-muted rounded" />
                    </div>
                  ) : user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setSheetOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive("/profile")
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <IconUser size={20} />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setSheetOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full text-left"
                      >
                        <IconPower size={20} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 px-3">
                      <Link href="/auth/login" onClick={() => setSheetOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/sign-up" onClick={() => setSheetOpen(false)}>
                        <Button variant="brand" className="w-full">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
