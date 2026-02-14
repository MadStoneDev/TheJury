import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Header Card */}
      <div className="rounded-2xl border bg-card overflow-hidden mb-6">
        <div className="h-1 bg-gradient-to-r from-emerald-500/30 to-teal-400/30" />
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-6 w-80 mb-2" />
              <Skeleton className="h-4 w-full max-w-lg mb-3" />
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="rounded-2xl border bg-card p-6">
        <Skeleton className="h-6 w-44 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-7 w-12 mb-1" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </div>
          ))}

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
