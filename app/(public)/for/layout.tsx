// app/(public)/for/layout.tsx
// Shared layout for the /for/* use-case pages.
export default function ForLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 animated-gradient-bg opacity-10 dark:opacity-20" />
      <div className="absolute inset-0 grid-bg" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        {children}
      </div>
    </section>
  );
}
