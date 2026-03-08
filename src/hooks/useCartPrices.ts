import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/lib/store';
import { formatCurrencyPrice } from '@/hooks/useProductPrices';

export interface CurrencyTotal {
  currency: string;
  total: number;
}

export interface CartItemPrices {
  productId: string;
  prices: { currency: string; unitPrice: number; lineTotal: number }[];
}

/**
 * Fetches multi-currency prices for all items in the cart and computes
 * per-item line totals and aggregate totals per currency.
 */
export function useCartPrices(items: CartItem[]) {
  const productIds = items.map(i => i.product.id);
  const sortedKey = [...productIds].sort().join(',');

  const { data: priceMap, isLoading } = useQuery({
    queryKey: ['cart-prices', sortedKey],
    queryFn: async () => {
      if (productIds.length === 0) return new Map<string, { currency: string; price: number }[]>();
      const { data, error } = await supabase
        .from('product_prices')
        .select('product_id, currency, price')
        .in('product_id', productIds);
      if (error) throw error;
      const map = new Map<string, { currency: string; price: number }[]>();
      (data ?? []).forEach(row => {
        if (!map.has(row.product_id)) map.set(row.product_id, []);
        map.get(row.product_id)!.push({ currency: row.currency, price: Number(row.price) });
      });
      return map;
    },
    enabled: productIds.length > 0,
  });

  // Memoize computed values
  const { itemPrices, currencyTotals } = useMemo(() => {
    const itemPrices: CartItemPrices[] = items.map(item => {
      const raw = priceMap?.get(item.product.id) ?? [];
      return {
        productId: item.product.id,
        prices: raw.map(p => ({
          currency: p.currency,
          unitPrice: p.price,
          lineTotal: p.price * item.quantity,
        })),
      };
    });

    const totalsMap = new Map<string, number>();
    itemPrices.forEach(ip => {
      ip.prices.forEach(p => {
        totalsMap.set(p.currency, (totalsMap.get(p.currency) ?? 0) + p.lineTotal);
      });
    });
    const currencyTotals: CurrencyTotal[] = [];
    totalsMap.forEach((total, currency) => currencyTotals.push({ currency, total }));

    return { itemPrices, currencyTotals };
  }, [priceMap, items]);

  return { itemPrices, currencyTotals, isLoading, formatCurrencyPrice };
}
