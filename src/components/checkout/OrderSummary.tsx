import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem } from '@/lib/store';
import { Loader2, ShoppingBag, ArrowRight, ArrowLeft, Check, Tag, X } from 'lucide-react';
import { TrustBadges } from '@/components/TrustBadges';
import { useCartPrices } from '@/hooks/useCartPrices';
import { MultiCurrencyDisplay } from '@/components/MultiCurrencyDisplay';
import { formatCurrencyPrice } from '@/hooks/useProductPrices';

interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canProceed: boolean;
  couponCode?: string;
  onCouponCodeChange?: (code: string) => void;
  onApplyCoupon?: () => void;
  onClearCoupon?: () => void;
  couponResult?: { valid: boolean; discount: number; message: string } | null;
  isValidatingCoupon?: boolean;
  discountAmount?: number;
}

export const OrderSummary = ({
  items,
  totalPrice,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  canProceed,
  couponCode = '',
  onCouponCodeChange,
  onApplyCoupon,
  onClearCoupon,
  couponResult,
  isValidatingCoupon,
  discountAmount = 0,
}: OrderSummaryProps) => {
  const { itemPrices, currencyTotals } = useCartPrices(items);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const finalTotal = totalPrice - discountAmount;

  return (
    <Card className="p-6 sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Tu Pedido</h2>
        <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      <div className="space-y-3 mb-6 max-h-52 overflow-y-auto pr-1">
        {items.map((item) => {
          const ip = itemPrices.find(p => p.productId === item.product.id);
          return (
            <div key={item.product.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-14 h-14 object-cover rounded-lg border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {item.product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} x {formatPrice(item.product.price)}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
                {/* Multi-currency per item */}
                {ip && ip.prices.length > 0 && (
                  <div className="flex flex-wrap gap-x-1.5 mt-0.5">
                    {ip.prices.map(p => (
                      <span key={p.currency} className="text-[11px] text-muted-foreground">
                        {formatCurrencyPrice(p.lineTotal, p.currency)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Section */}
      {onApplyCoupon && (
        <div className="mb-4 pb-4 border-b">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
            <Tag className="h-4 w-4" />
            Cupón de descuento
          </label>
          {couponResult?.valid ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <div>
                <span className="text-sm font-medium text-primary">{couponCode.toUpperCase()}</span>
                <span className="text-xs text-muted-foreground ml-2">-{formatPrice(discountAmount)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClearCoupon} className="h-7 w-7 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Código del cupón"
                value={couponCode}
                onChange={(e) => onCouponCodeChange?.(e.target.value.toUpperCase())}
                className="text-sm uppercase"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onApplyCoupon}
                disabled={!couponCode.trim() || isValidatingCoupon}
                className="shrink-0"
              >
                {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
              </Button>
            </div>
          )}
          {couponResult && !couponResult.valid && (
            <p className="text-xs text-destructive mt-1.5">{couponResult.message}</p>
          )}
        </div>
      )}

      <div className="border-t pt-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        {/* Multi-currency subtotals */}
        {currencyTotals.length > 0 && (
          <div className="space-y-1 pl-1">
            {currencyTotals.map(ct => (
              <div key={ct.currency} className="flex justify-between text-xs text-muted-foreground">
                <span>En {ct.currency}</span>
                <span>{formatCurrencyPrice(ct.total, ct.currency)}</span>
              </div>
            ))}
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>Descuento</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Envío</span>
          <span className="text-green-600 font-medium">Por confirmar</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t">
          <span>Total</span>
          <span className="text-primary">{formatPrice(finalTotal)}</span>
        </div>
        {currencyTotals.length > 0 && (
          <MultiCurrencyDisplay prices={currencyTotals} className="justify-end" size="md" />
        )}
      </div>

      <div className="space-y-3">
        {isLastStep ? (
          <Button
            onClick={onSubmit}
            size="lg"
            className="w-full h-12 text-base"
            disabled={isSubmitting || !canProceed}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Confirmar Pedido
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            size="lg"
            className="w-full h-12 text-base"
            disabled={!canProceed}
          >
            Continuar
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}

        {!isFirstStep && (
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="w-full h-12 text-base"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Te contactaremos para confirmar tu pedido
      </p>

      <TrustBadges />
    </Card>
  );
};
