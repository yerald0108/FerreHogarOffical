import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProductViewTrackerProps {
  productId: string;
}

export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!productId) return;

    // Debounce: only track once per session per product
    const key = `viewed_${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    supabase
      .from('product_views')
      .insert({ product_id: productId, user_id: user?.id || null })
      .then(({ error }) => {
        if (error) console.error('Error tracking view:', error);
      });
  }, [productId, user?.id]);

  return null;
}
