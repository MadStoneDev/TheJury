// app/(public)/layout.tsx
import { Navbar } from "@/components/Navbar";

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
    </main>
  );
}
