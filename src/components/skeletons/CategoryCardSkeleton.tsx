import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </>
  );
}
