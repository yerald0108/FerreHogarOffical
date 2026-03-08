import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductPrice {
  id: string;
  product_id: string;
  currency: string;
  price: number;
}

// Fetch prices for a single product
export function useProductPrices(productId: string) {
  return useQuery({
    queryKey: ['product-prices', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', productId);
      if (error) throw error;
      return data as ProductPrice[];
    },
    enabled: !!productId,
  });
}

// Fetch prices for multiple products (bulk)
export function useAllProductPrices(productIds: string[]) {
  return useQuery({
    queryKey: ['product-prices-bulk', [...productIds].sort().join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return new Map<string, ProductPrice[]>();
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .in('product_id', productIds);
      if (error) throw error;
      const map = new Map<string, ProductPrice[]>();
      (data as ProductPrice[]).forEach(p => {
        if (!map.has(p.product_id)) map.set(p.product_id, []);
        map.get(p.product_id)!.push(p);
      });
      return map;
    },
    enabled: productIds.length > 0,
  });
}

const CURRENCY_LABELS: Record<string, string> = {
  USD: '$ USD',
  EUR: '€ EUR',
  MLC: 'MLC',
  Zelle: 'Zelle',
  CUP: 'CUP',
};

export function formatCurrencyPrice(price: number, currency: string) {
  const symbol = CURRENCY_LABELS[currency] || currency;
  return `${price.toLocaleString('es-CU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
}
