// app/(public)/layout.tsx
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      {/* Navbar spacing */}
      <div className="h-16" />
      <div className="flex-1">{children}</div>
      <Footer />
    </main>
  );
}
