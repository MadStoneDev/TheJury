import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/Container";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 sm:py-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-9 w-40 mb-8" />

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Skeleton className="h-6 w-28 mb-6" />
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-10 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton className="h-6 w-28 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
