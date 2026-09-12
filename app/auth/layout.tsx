import Link from "next/link";
import { AuthPanel } from "@/components/AuthPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-jury-base">
      {/* Left panel — desktop */}
      <AuthPanel />

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header (with a compact poll card via the panel copy) */}
        <div className="border-b border-jury-border-subtle p-6 text-center lg:hidden">
          <Link href="/" className="font-display text-2xl text-jury-text hover:text-jury-emerald-hi">
            TheJury
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
