import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/Container";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 sm:py-8">
      <Container>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between xs:items-center gap-4 mb-8">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-12 w-44 rounded-md" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          {/* Poll Cards */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-96 mb-2" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 lg:max-w-[400px]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <Skeleton key={j} className="h-9 w-24 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
