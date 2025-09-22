// app/(public)/layout.tsx
import { Navbar } from "@/components/Navbar";
import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Navbar />
      {/* Spacing */}
      <div className={`block h-16`} />
      {children}

      <GoogleAnalytics gaId="G-6MLKG18LB1" />
    </main>
  );
}
