import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  Clock, 
  CreditCard, 
  Phone, 
  Copy, 
  Check,
  Home,
  ShoppingBag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAllProductPrices, formatCurrencyPrice } from '@/hooks/useProductPrices';
import { useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';

interface OrderDetails {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  municipality: string;
  phone: string;
  delivery_time: string;
  payment_method: string;
  notes: string | null;
  items: {
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    price_at_purchase: number;
  }[];
}

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Multi-currency prices for order items
  const itemProductIds = useMemo(() => 
    (order?.items || []).map(i => i.id).length > 0
      ? [...new Set((order?.items || []).filter(i => i.product_id).map(i => i.product_id!))]
      : [],
    [order]
  );
  // We need product_id on items, let's handle it
  const { data: bulkPrices } = useAllProductPrices(itemProductIds);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user && orderId) {
      fetchOrder();
    }
  }, [user, authLoading, orderId]);

  useEffect(() => {
    // Disparar confetti al cargar
    if (order) {
      const duration = 2500;
      const end = Date.now() + duration;
      
      const fireConfetti = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899'],
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(fireConfetti);
        }
      };
      
      fireConfetti();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899'],
      });
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      
      if (!orderData) {
        setOrder(null);
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder({
        ...orderData,
        items: itemsData || [],
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeliveryTimeLabel = (time: string) => {
    const times: Record<string, string> = {
      manana: 'Mañana (8:00 AM - 12:00 PM)',
      tarde: 'Tarde (2:00 PM - 6:00 PM)',
      noche: 'Noche (6:00 PM - 9:00 PM)',
    };
    return times[time] || time;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      efectivo: 'Efectivo (CUP)',
      transfermovil: 'Transfermóvil',
      tarjeta: 'Tarjeta (MLC)',
    };
    return methods[method] || method;
  };

  const copyOrderId = () => {
    if (order) {
      navigator.clipboard.writeText(order.id.slice(0, 8).toUpperCase());
      setCopied(true);
      toast.success('Número de pedido copiado');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Pedido no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              No pudimos encontrar el pedido que buscas
            </p>
            <Link to="/">
              <Button size="lg">Volver al inicio</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Pedido Confirmado" description="Tu pedido ha sido recibido. Revisa los detalles y el estado de tu compra." />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-muted-foreground">
              Gracias por tu compra. Te contactaremos pronto para confirmar la entrega.
            </p>
          </div>

          {/* Order Number Card */}
          <Card className="p-6 mb-6 bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Número de pedido</p>
                <p className="text-2xl font-bold text-primary font-mono">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyOrderId}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Guarda este número para dar seguimiento a tu pedido
            </p>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Details */}
            <Card className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Detalles del Pedido
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Pendiente de confirmación
                  </Badge>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha del pedido</p>
                  <p className="text-foreground capitalize">{formatDate(order.created_at)}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPrice(item.price_at_purchase * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                  {/* Multi-currency totals */}
                  {bulkPrices && bulkPrices.size > 0 && (() => {
                    const currencyTotals = new Map<string, number>();
                    order.items.forEach((item) => {
                      const prices = item.product_id ? bulkPrices.get(item.product_id) : undefined;
                      if (prices) {
                        prices.forEach((p) => {
                          currencyTotals.set(
                            p.currency,
                            (currencyTotals.get(p.currency) || 0) + p.price * item.quantity
                          );
                        });
                      }
                    });
                    if (currencyTotals.size === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {Array.from(currencyTotals.entries()).map(([currency, total]) => (
                          <span key={currency} className="text-sm text-muted-foreground font-medium">
                            {formatCurrencyPrice(total, currency)}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </Card>

            {/* Delivery & Payment Info */}
            <div className="space-y-6">
              <Card className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Entrega
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dirección</p>
                    <p className="text-foreground">{order.delivery_address}</p>
                    <p className="text-sm text-muted-foreground">{(order as any).province ? `${order.municipality}, ${(order as any).province}` : order.municipality}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getDeliveryTimeLabel(order.delivery_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.phone}</span>
                  </div>
                  
                  {order.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
                      <p className="text-sm text-foreground">{order.notes}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Método de Pago
                </h2>
                <p className="text-foreground">{getPaymentMethodLabel(order.payment_method)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Te contactaremos para coordinar el pago
                </p>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
            <Link to="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Home className="h-5 w-5" />
                Volver al inicio
              </Button>
            </Link>
            <Link to="/productos">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <ShoppingBag className="h-5 w-5" />
                Seguir comprando
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            ¿Tienes preguntas? Contáctanos por WhatsApp o llámanos al teléfono de la tienda.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
