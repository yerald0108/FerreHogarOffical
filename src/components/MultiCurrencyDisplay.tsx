import { CurrencyTotal } from '@/hooks/useCartPrices';
import { formatCurrencyPrice } from '@/hooks/useProductPrices';
import { cn } from '@/lib/utils';

interface MultiCurrencyDisplayProps {
  prices: { currency: string; total: number }[];
  className?: string;
  labelClassName?: string;
  size?: 'sm' | 'md';
}

/** Renders a compact list of currency totals, e.g. "25.00 $ USD · 20.00 € EUR" */
export function MultiCurrencyDisplay({ prices, className, labelClassName, size = 'sm' }: MultiCurrencyDisplayProps) {
  if (!prices || prices.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-x-2 gap-y-0.5', className)}>
      {prices.map((p, i) => (
        <span key={p.currency} className={cn(
          size === 'sm' ? 'text-xs' : 'text-sm',
          'text-muted-foreground font-medium',
          labelClassName
        )}>
          {formatCurrencyPrice(p.total, p.currency)}
          {i < prices.length - 1 && <span className="ml-2 text-border">·</span>}
        </span>
      ))}
    </div>
  );
}
