import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, ArrowRight, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useCartPrices } from '@/hooks/useCartPrices';
import { MultiCurrencyDisplay } from '@/components/MultiCurrencyDisplay';
import { formatCurrencyPrice } from '@/hooks/useProductPrices';

interface MiniCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiniCart({ open, onOpenChange }: MiniCartProps) {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const { itemPrices, currencyTotals } = useCartPrices(items);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleIncrement = (productId: string, currentQty: number, stock: number, name: string) => {
    if (currentQty >= stock) {
      toast.error(`No hay más stock disponible de ${name}`);
      return;
    }
    updateQuantity(productId, currentQty + 1);
    toast.success(`${name} — cantidad: ${currentQty + 1}`);
  };

  const handleDecrement = (productId: string, currentQty: number, name: string) => {
    if (currentQty <= 1) {
      toast.info('Usa el botón eliminar para quitar el producto');
      return;
    }
    updateQuantity(productId, currentQty - 1);
    toast.success(`${name} — cantidad: ${currentQty - 1}`);
  };

  const handleRemove = (productId: string, name: string) => {
    removeItem(productId);
    toast.success(`${name} eliminado del carrito`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[350px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tu Carrito ({items.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tu carrito está vacío
            </p>
          ) : (
            items.map((item) => {
              const ip = itemPrices.find(p => p.productId === item.product.id);
              return (
                <div key={item.product.id} className="flex gap-3 items-start">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-14 h-14 object-cover rounded-lg bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                    {/* Multi-currency line prices */}
                    {ip && ip.prices.length > 0 && (
                      <div className="flex flex-wrap gap-x-1.5 mt-0.5">
                        {ip.prices.map(p => (
                          <span key={p.currency} className="text-[11px] text-muted-foreground">
                            {formatCurrencyPrice(p.lineTotal, p.currency)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDecrement(item.product.id, item.quantity, item.product.name)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleIncrement(item.product.id, item.quantity, item.product.stock, item.product.name)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(item.product.id, item.product.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total</span>
              <div className="text-right">
                <span className="text-lg font-bold text-primary block">
                  {formatPrice(getTotalPrice())}
                </span>
                {currencyTotals.length > 0 && (
                  <MultiCurrencyDisplay prices={currencyTotals} className="justify-end" />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/carrito" className="flex-1" onClick={() => onOpenChange(false)}>
                <Button variant="outline" className="w-full">
                  Ver carrito
                </Button>
              </Link>
              <Link to="/checkout" className="flex-1" onClick={() => onOpenChange(false)}>
                <Button className="w-full gap-1">
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
