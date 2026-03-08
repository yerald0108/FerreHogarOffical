import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BulkRating {
  averageRating: number;
  totalReviews: number;
}

/**
 * Fetch ratings for multiple products in a single query.
 * Returns a Map<productId, { averageRating, totalReviews }>.
 */
export function useBulkProductRatings(productIds: string[]) {
  return useQuery({
    queryKey: ['bulk-ratings', [...productIds].sort().join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return new Map<string, BulkRating>();

      const { data, error } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds)
        .eq('is_visible', true);

      if (error) throw error;

      const map = new Map<string, BulkRating>();
      const grouped = new Map<string, number[]>();

      (data || []).forEach((r) => {
        if (!grouped.has(r.product_id)) grouped.set(r.product_id, []);
        grouped.get(r.product_id)!.push(r.rating);
      });

      grouped.forEach((ratings, pid) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        map.set(pid, {
          averageRating: Math.round(avg * 10) / 10,
          totalReviews: ratings.length,
        });
      });

      return map;
    },
    enabled: productIds.length > 0,
    staleTime: 60_000,
  });
}
