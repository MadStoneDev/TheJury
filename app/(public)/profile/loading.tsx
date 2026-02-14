import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Skeleton className="h-9 w-40 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border bg-card p-6 text-center">
              <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-1" />
              <Skeleton className="h-4 w-48 mx-auto mb-4" />
              <Skeleton className="h-6 w-16 mx-auto rounded-full" />
              <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Skeleton className="h-8 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
                <div className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-6">
              <Skeleton className="h-6 w-28 mb-6" />
              <Skeleton className="h-4 w-20 mb-2" />
              <div className="flex gap-3">
                <Skeleton className="flex-1 h-11 rounded-lg" />
                <Skeleton className="h-11 w-20 rounded-lg" />
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <Skeleton className="h-6 w-36 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
