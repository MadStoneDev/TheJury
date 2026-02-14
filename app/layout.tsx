// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TooltipProvider } from "@/components/ui/tooltip";

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

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
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
      <body
        className={`${outfitSans.variable} ${dmSerifDisplay.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>

          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>

      <GoogleAnalytics gaId="G-6MLKG18LB1" />
    </html>
  );
}
