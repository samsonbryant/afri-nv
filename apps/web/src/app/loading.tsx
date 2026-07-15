import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="mx-auto h-10 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
