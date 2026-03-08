import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
