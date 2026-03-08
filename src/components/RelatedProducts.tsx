import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { Loader2 } from 'lucide-react';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';

interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string | null;
}

export function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const { data: relatedProducts = [], isLoading } = useQuery({
    queryKey: ['related-products', categoryId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .neq('id', currentProductId)
        .gt('stock', 0)
        .limit(4);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length < 4 && categoryId) {
        const existingIds = [currentProductId, ...data.map((p) => p.id)];
        const { data: moreProducts } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_active', true)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .gt('stock', 0)
          .limit(4 - data.length);

        if (moreProducts) {
          return [...data, ...moreProducts];
        }
      }

      return data || [];
    },
    enabled: !!currentProductId,
    staleTime: 60_000,
  });

  const productIds = useMemo(() => relatedProducts.map(p => p.id), [relatedProducts]);
  const { data: bulkRatings } = useBulkProductRatings(productIds);
  const { data: bulkPrices } = useAllProductPrices(productIds);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  const formattedProducts = relatedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_url || '/placeholder.svg',
    stock: product.stock,
    description: product.description || '',
    category: product.categories?.name || 'Sin categoría',
  }));

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Productos relacionados
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {formattedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            bulkMode
            bulkRating={bulkRatings?.get(product.id)}
            bulkPrices={bulkPrices?.get(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
