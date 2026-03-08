import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/lib/store';

export interface StockCheckResult {
  product_id: string;
  product_name: string;
  requested: number;
  available: number;
  is_available: boolean;
}

export async function checkStockAvailability(items: CartItem[]): Promise<{
  allAvailable: boolean;
  results: StockCheckResult[];
}> {
  const itemsJson = items.map(item => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('check_stock_availability', {
    p_items: itemsJson,
  });

  if (error) {
    console.error('Error checking stock:', error);
    throw new Error('No se pudo verificar la disponibilidad del stock');
  }

  const results = data as StockCheckResult[];
  const allAvailable = results.every(r => r.is_available);

  return { allAvailable, results };
}

export function getUnavailableItems(results: StockCheckResult[]): StockCheckResult[] {
  return results.filter(r => !r.is_available);
}
