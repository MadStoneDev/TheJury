// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TheJury - Create and Share Polls Instantly",
  description:
    "Create polls quickly and easily. Share with a simple code, get real-time results. Perfect for teams, events, and decision-making.",
};

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfitSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>

        <footer className={`p-4 sm:p-8 text-center text-xs text-neutral-600`}>
          <p>
            Made with ❤️ by{" "}
            <Link
              href={`https://ravenci.solutions`}
              className={`hover:p-1 hover:bg-emerald-600 hover:text-white transition-all duration-300 ease-in-out`}
            >
              RAVENCI
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
