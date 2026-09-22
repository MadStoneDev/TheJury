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

const defaultTitle =
  "TheJury — Australian-hosted polls and votes for organisations";
const defaultDescription =
  "Anonymous staff feedback, AGM motions, community consultation and live session polls. Hosted in Australia, with a results record you can attach to the minutes. No account needed to vote.";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: defaultTitle,
  description: defaultDescription,
  openGraph: {
    type: "website",
    siteName: "TheJury",
    title: defaultTitle,
    description: defaultDescription,
    url: defaultUrl,
    images: [
      {
        url: "thejury-og.png",
        width: 1920,
        height: 1080,
        alt: "TheJury — Australian-hosted polls and votes for organisations.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["thejury-og.png"],
  },
};

// Site-wide structured data. TheJury is operated by RAVENCI (a registered
// business name of Richard Haddad, sole trader, QLD). Street address omitted
// on purpose (sole-trader/residential); state only.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TheJury",
  legalName: "RAVENCI",
  url: defaultUrl,
  logo: `${defaultUrl}/thejury-og.png`,
  areaServed: "AU",
  address: {
    "@type": "PostalAddress",
    addressCountry: "AU",
    addressRegion: "QLD",
  },
  identifier: {
    "@type": "PropertyValue",
    name: "ABN",
    value: "35 664 615 205",
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TheJury",
  url: defaultUrl,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
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
