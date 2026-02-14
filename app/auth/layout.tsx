import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Branding Panel - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg opacity-20" />
        <div className="absolute inset-0 grid-bg" />
        <div className="relative text-center px-12">
          <Link href="/" className="text-5xl font-display text-white mb-4 block hover:text-emerald-400 transition-colors">
            TheJury
          </Link>
          <p className="text-lg text-slate-400 max-w-sm mx-auto">
            Create beautiful polls and get instant feedback from your audience.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Branding Header */}
        <div className="lg:hidden p-6 text-center border-b border-border">
          <Link href="/" className="text-2xl font-display text-foreground hover:text-emerald-500 transition-colors">
            TheJury
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
