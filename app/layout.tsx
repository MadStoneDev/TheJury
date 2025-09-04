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
  title: "TheJury - Polling Platform",
  description: "Create and participate in polls with TheJury",
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
      <body className={`${outfitSans.className} antialiased pb-8`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <footer
            className={`fixed bottom-0 left-0 right-0 p-2 bg-white text-center text-xs text-neutral-600`}
          >
            <p>
              Made with ❤️ by{" "}
              <Link
                target="_blank"
                href={`https://ravenci.solutions`}
                className={`hover:p-1 hover:bg-emerald-600 hover:text-white transition-all duration-300 ease-in-out`}
              >
                RAVENCI
              </Link>
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
