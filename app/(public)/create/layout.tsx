// app/create/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creating a new Poll - TheJury",
  description: "Create a new poll and get answered from your community.",
};

export default function PollLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
