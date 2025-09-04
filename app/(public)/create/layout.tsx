// app/create/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creating a new Poll - TheJury",
  description: "Create a new poll and get answered from your community.",
  openGraph: {
    type: "website",
    siteName: "TheJury",
    title: "Creating a new Poll - TheJury",
    description: "Create a new poll and get answered from your community.",
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
    title: "Creating a new Poll - TheJury",
    description: "Create a new poll and get answered from your community.",
    images: ["thejury-opengraph.jpg"],
  },
};

export default function PollLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
