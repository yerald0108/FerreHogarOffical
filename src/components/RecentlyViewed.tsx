import { useRecentlyViewedStore } from '@/hooks/useRecentlyViewed';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';
import { useMemo } from 'react';

interface RecentlyViewedProps {
  excludeId?: string;
}

export function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const ids = useRecentlyViewedStore((s) => s.ids);
  const filtered = useMemo(() => ids.filter((id) => id !== excludeId).slice(0, 4), [ids, excludeId]);

  const { data: products } = useQuery({
    queryKey: ['recently-viewed-products', filtered],
    queryFn: async () => {
      if (filtered.length === 0) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .in('id', filtered)
        .eq('is_active', true);
      if (error) throw error;
      // Preserve order
      const map = new Map(data.map((p) => [p.id, p]));
      return filtered.map((id) => map.get(id)).filter(Boolean) as typeof data;
    },
    enabled: filtered.length > 0,
    staleTime: 60_000,
  });

  const productIds = useMemo(() => (products || []).map((p) => p.id), [products]);
  const { data: bulkRatings } = useBulkProductRatings(productIds);
  const { data: bulkPrices } = useAllProductPrices(productIds);

  if (!products || products.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Vistos recientemente</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {products.map((product, index) => (
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
    </section>
  );
}
