// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://thejury.app"
    : "http://localhost:3888");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TheJury - Polling Platform",
  description: "Create and participate in polls with TheJury",
  openGraph: {
    type: "website",
    siteName: "TheJury",
    title: "TheJury - Polling Platform",
    description: "Create and participate in polls with TheJury",
    url: defaultUrl,
    images: [
      {
        url: "thejury-opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "TheJury - Polling Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TheJury - Polling Platform",
    description: "Create and participate in polls with TheJury",
    images: ["thejury-opengraph.jpg"],
  },
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
