import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import { useMemo } from 'react';

export function DealsSection() {
  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_active', true)
        .not('compare_at_price', 'is', null)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      // Filter client-side to ensure compare_at_price > price
      return (data ?? []).filter(p => p.compare_at_price && p.compare_at_price > p.price);
    },
    staleTime: 1000 * 60 * 5,
  });

  const dealIds = useMemo(() => (deals ?? []).map(p => p.id), [deals]);
  const { data: bulkRatings } = useBulkProductRatings(dealIds);
  const { data: bulkPrices } = useAllProductPrices(dealIds);

  if (!isLoading && (!deals || deals.length === 0)) return null;

  return (
    <section className="py-8 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6 md:mb-10">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-destructive" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ofertas</h2>
          </div>
          <Badge variant="destructive" className="text-xs">
            ¡Precios rebajados!
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <ProductGridSkeleton count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {deals!.map((product, index) => (
              <ProductCard
                key={product.id}
                index={index}
                bulkMode
                bulkRating={bulkRatings?.get(product.id)}
                bulkPrices={bulkPrices?.get(product.id)}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image_url || '/placeholder.svg',
                  category: product.categories?.name || '',
                  description: product.description || '',
                  stock: product.stock,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
