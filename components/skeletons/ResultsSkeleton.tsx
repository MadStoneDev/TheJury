import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/Container";

export default function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <div className="mb-8">
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Poll Info Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 mb-4 lg:mb-0">
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-9 w-40" />
                </div>
                <Skeleton className="h-7 w-80 mb-2" />
                <Skeleton className="h-5 w-full max-w-lg mb-4" />
                <div className="flex flex-wrap items-center gap-4">
                  <Skeleton className="h-7 w-24 rounded" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Skeleton className="h-7 w-44 mb-6" />
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Skeleton className="h-6 w-48 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-8 w-14 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full rounded-full" />
                </div>
              ))}

              {/* Summary Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-8 w-12 mx-auto mb-2" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
