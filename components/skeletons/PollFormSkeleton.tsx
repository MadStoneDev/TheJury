import { Skeleton } from "@/components/ui/skeleton";

export default function PollFormSkeleton() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Skeleton className="h-5 w-40 mb-6" />

        <div className="rounded-2xl border bg-card overflow-hidden shadow-lg">
          <div className="h-1 bg-gradient-to-r from-emerald-500/30 to-teal-400/30" />
          <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-56 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>

            <div className="space-y-6">
              {/* Question */}
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              {/* Description */}
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>

              {/* Options */}
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-56 mb-3" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-12 w-full mt-3 rounded-xl border-dashed" />
              </div>

              {/* Settings */}
              <div className="rounded-xl border bg-muted/50 p-4">
                <Skeleton className="h-4 w-28 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-5 w-5 rounded mr-3" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Skeleton className="flex-1 h-12 rounded-lg" />
                <Skeleton className="h-12 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
