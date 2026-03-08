import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertTriangle, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCartPrices } from '@/hooks/useCartPrices';
import { MultiCurrencyDisplay } from '@/components/MultiCurrencyDisplay';
import { formatCurrencyPrice } from '@/hooks/useProductPrices';

const Cart = () => {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);
  const { itemPrices, currencyTotals } = useCartPrices(items);
  const [compareAtPrices, setCompareAtPrices] = useState<Map<string, number>>(new Map());

  // Fetch compare_at_price for cart items to calculate savings
  useEffect(() => {
    const fetchCompareAtPrices = async () => {
      if (items.length === 0) return;
      const productIds = items.map(item => item.product.id);
      const { data } = await supabase
        .from('products')
        .select('id, compare_at_price')
        .in('id', productIds)
        .not('compare_at_price', 'is', null);
      if (data) {
        const map = new Map<string, number>();
        data.forEach(p => {
          if (p.compare_at_price && p.compare_at_price > 0) map.set(p.id, Number(p.compare_at_price));
        });
        setCompareAtPrices(map);
      }
    };
    fetchCompareAtPrices();
  }, [items.length]);

  const totalSavings = useMemo(() => {
    return items.reduce((acc, item) => {
      const compareAt = compareAtPrices.get(item.product.id);
      if (compareAt && compareAt > item.product.price) {
        return acc + (compareAt - item.product.price) * item.quantity;
      }
      return acc;
    }, 0);
  }, [items, compareAtPrices]);

  // Sync prices and validate stock on load
  useEffect(() => {
    const syncCart = async () => {
      if (items.length === 0) return;

      const productIds = items.map(item => item.product.id);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, price, stock, name, is_active')
        .in('id', productIds);

      if (error || !products) return;

      const warnings: string[] = [];
      const store = useCartStore.getState();

      products.forEach(dbProduct => {
        const cartItem = items.find(i => i.product.id === dbProduct.id);
        if (!cartItem) return;

        if (!dbProduct.is_active) {
          store.removeItem(dbProduct.id);
          warnings.push(`"${dbProduct.name}" ya no está disponible y fue eliminado del carrito.`);
          return;
        }

        if (Number(dbProduct.price) !== cartItem.product.price) {
          useCartStore.setState((state) => ({
            items: state.items.map(i =>
              i.product.id === dbProduct.id
                ? { ...i, product: { ...i.product, price: Number(dbProduct.price), stock: dbProduct.stock } }
                : i
            ),
          }));
          warnings.push(`El precio de "${dbProduct.name}" se actualizó.`);
        }

        if (dbProduct.stock === 0) {
          store.removeItem(dbProduct.id);
          warnings.push(`"${dbProduct.name}" se agotó y fue eliminado del carrito.`);
        } else if (cartItem.quantity > dbProduct.stock) {
          store.updateQuantity(dbProduct.id, dbProduct.stock);
          warnings.push(`La cantidad de "${dbProduct.name}" se ajustó a ${dbProduct.stock} (stock disponible).`);
        } else {
          useCartStore.setState((state) => ({
            items: state.items.map(i =>
              i.product.id === dbProduct.id
                ? { ...i, product: { ...i.product, stock: dbProduct.stock } }
                : i
            ),
          }));
        }
      });

      if (warnings.length > 0) {
        setStockWarnings(warnings);
      }
    };

    syncCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="Mi Carrito" description="Revisa los productos en tu carrito y procede al pago." />
        <Header />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="text-center">
            <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-muted mx-auto mb-4 md:mb-6">
              <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">Tu carrito está vacío</h1>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Añade algunos productos para comenzar tu compra
            </p>
            <Link to="/productos">
              <Button size="lg" className="gap-2">
                Explorar Productos
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Mi Carrito" description="Revisa los productos en tu carrito y procede al pago." />
      <Header />
      
      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Mi Carrito' }]} />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Mi Carrito</h1>
          
          {stockWarnings.length > 0 && (
            <Alert variant="destructive" className="mb-4 md:mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {stockWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {items.map((item) => {
                const ip = itemPrices.find(p => p.productId === item.product.id);
                return (
                  <Card key={item.product.id} className="p-3 md:p-4">
                    <div className="flex gap-3 md:gap-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {formatPrice(item.product.price)} c/u
                            </p>
                            {/* Multi-currency unit prices */}
                            {ip && ip.prices.length > 0 && (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                {ip.prices.map(p => (
                                  <span key={p.currency} className="text-xs text-muted-foreground">
                                    {formatCurrencyPrice(p.unitPrice, p.currency)} c/u
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                            onClick={() => {
                              removeItem(item.product.id);
                              toast.success(`${item.product.name} eliminado del carrito`);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 md:mt-4">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                              className="w-12 md:w-16 text-center h-7 md:h-8 text-sm"
                              min={1}
                              max={item.product.stock}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-primary text-base md:text-lg block">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                            {/* Multi-currency line totals */}
                            {ip && ip.prices.length > 0 && (
                              <MultiCurrencyDisplay prices={ip.prices.map(p => ({ currency: p.currency, total: p.lineTotal }))} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    Vaciar carrito
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm w-[calc(100vw-2rem)] mx-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Vaciar el carrito?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todos los productos de tu carrito.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearCart();
                        toast.success('Carrito vaciado completamente');
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, vaciar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {/* Order Summary - desktop */}
            <div className="hidden lg:block">
              <Card className="p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-foreground mb-6">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)} productos)</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  {/* Multi-currency totals */}
                  {currencyTotals.length > 0 && (
                    <div className="space-y-1 pl-1">
                      {currencyTotals.map(ct => (
                        <div key={ct.currency} className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtotal en {ct.currency}</span>
                          <span>{formatCurrencyPrice(ct.total, ct.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Tag className="h-3.5 w-3.5" />
                        Ahorro total
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">-{formatPrice(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Envío</span>
                    <span className="text-success">Calcular al checkout</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                  </div>
                  {currencyTotals.length > 0 && (
                    <MultiCurrencyDisplay
                      prices={currencyTotals}
                      className="justify-end"
                      size="md"
                    />
                  )}
                </div>
                
                <Link to="/checkout">
                  <Button size="lg" className="w-full gap-2">
                    Proceder al Pago
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Al continuar, aceptas nuestros términos y condiciones
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky checkout bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-lg border-t p-3">
        <div className="container mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{items.reduce((acc, item) => acc + item.quantity, 0)} productos</p>
            <p className="font-bold text-primary text-lg">{formatPrice(getTotalPrice())}</p>
            {totalSavings > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Ahorras {formatPrice(totalSavings)}</p>
            )}
            {currencyTotals.length > 0 && (
              <MultiCurrencyDisplay prices={currencyTotals} />
            )}
          </div>
          <Link to="/checkout">
            <Button className="gap-2">
              Pagar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Cart;
