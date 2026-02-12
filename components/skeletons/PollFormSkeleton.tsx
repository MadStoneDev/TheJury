import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/Container";

export default function PollFormSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Skeleton className="h-9 w-56 mx-auto mb-2" />
              <Skeleton className="h-5 w-64 mx-auto" />
            </div>

            <div className="space-y-6">
              {/* Question */}
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>

              {/* Description */}
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-24 w-full rounded-md" />
              </div>

              {/* Options */}
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-56 mb-3" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-5 w-40 mt-3" />
              </div>

              {/* Settings */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <Skeleton className="h-5 w-28 mb-3" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-4 w-4 rounded mr-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <Skeleton className="flex-1 h-12 rounded-md" />
                <Skeleton className="h-12 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
