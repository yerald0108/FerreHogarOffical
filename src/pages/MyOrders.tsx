import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUserOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Calendar, MapPin, CreditCard, Eye, ShoppingBag, ChevronLeft, ChevronRight, Search, XCircle, RefreshCw, Loader2, CheckCircle2, Truck } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';
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
import { OrderProgressTracker } from '@/components/OrderProgressTracker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { SEOHead } from '@/components/SEOHead';

const ORDERS_PER_PAGE = 10;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  preparing: { label: 'Preparando', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'default' },
  delivered: { label: 'Entregado', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: orders, isLoading, error } = useUserOrders();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' as any })
        .eq('id', orderId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      toast.success('Pedido cancelado correctamente');
    } catch {
      toast.error('Error al cancelar el pedido');
    } finally {
      setCancellingId(null);
    }
  };

  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingDelivery(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' as any })
        .eq('id', orderId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      toast.success('¡Entrega confirmada! Gracias por tu compra.');
    } catch {
      toast.error('Error al confirmar la entrega');
    } finally {
      setConfirmingDelivery(null);
    }
  };

  const handleReorder = async (order: any) => {
    setReorderingId(order.id);
    try {
      const items = order.order_items || [];
      // Fetch current product info
      const productIds = items.map((i: any) => i.product_id).filter(Boolean);
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      const productMap = new Map((products || []).map(p => [p.id, p]));
      let added = 0;
      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (product && product.stock > 0) {
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || '/placeholder.svg',
            description: product.description || '',
            category: '',
            stock: product.stock,
          }, Math.min(item.quantity, product.stock));
          added++;
        }
      }
      if (added > 0) {
        toast.success(`${added} producto(s) añadidos al carrito`);
        navigate('/carrito');
      } else {
        toast.error('Los productos de este pedido ya no están disponibles');
      }
    } catch {
      toast.error('Error al repetir el pedido');
    } finally {
      setReorderingId(null);
    }
  };

  // Realtime subscription for order status updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  const formatOrderId = (id: string) => id.slice(0, 8).toUpperCase();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy - HH:mm", { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
    }).format(amount);
  };

  // Filter orders by search query
  const filteredOrders = orders?.filter(order => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const idMatch = order.id.toLowerCase().includes(query);
    const productMatch = order.order_items?.some(item => 
      item.product_name.toLowerCase().includes(query)
    );
    return idMatch || productMatch;
  });

  const totalPages = filteredOrders ? Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) : 0;
  const paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Mis Pedidos" description="Consulta el estado y el historial de tus pedidos en FerreHogar." />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Mis Pedidos</h1>
            </div>
            {orders && orders.length > 0 && (
              <div className="relative w-full sm:w-72 sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por # pedido o producto..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {isLoading || authLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-destructive mb-4">Error al cargar los pedidos</p>
                <Button onClick={() => window.location.reload()}>Reintentar</Button>
              </CardContent>
            </Card>
          ) : paginatedOrders && paginatedOrders.length > 0 ? (
            <>
              <div className="space-y-4">
                {paginatedOrders.map((order) => {
                  const status = statusConfig[order.status] || { label: order.status, variant: 'secondary' as const };
                  
                  return (
                    <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="bg-muted/50 pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-semibold">
                              Pedido #{formatOrderId(order.id)}
                            </CardTitle>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        <OrderProgressTracker 
                          status={order.status} 
                          statusHistory={(order.order_status_history || []).map(h => ({
                            new_status: h.new_status,
                            created_at: h.created_at,
                          }))}
                        />
                        <div className="grid gap-3 text-sm mt-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{order.delivery_address}, {order.municipality}{order.province ? `, ${order.province}` : ''}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span className="capitalize">{order.payment_method}</span>
                          </div>

                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="font-medium mb-2">Productos:</p>
                              <ul className="space-y-1">
                                {order.order_items.map((item) => (
                                  <li key={item.id} className="flex justify-between text-muted-foreground">
                                    <span>{item.quantity}x {item.product_name}</span>
                                    <span>{formatCurrency(item.price_at_purchase * item.quantity)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {order.status === 'cancelled' && order.cancellation_reason && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                <p className="font-medium text-destructive text-sm">Motivo de cancelación:</p>
                                <p className="text-sm text-muted-foreground mt-1">{order.cancellation_reason}</p>
                              </div>
                            </div>
                          )}

                          {/* Tracking info */}
                          {order.tracking_info && order.status === 'shipped' && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="font-medium text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1.5">
                                  <Truck className="h-4 w-4" />
                                  Información de envío
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">{order.tracking_info}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-end">
                          {/* Delivery confirmation button */}
                          {order.status === 'shipped' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm" disabled={confirmingDelivery === order.id} className="gap-1">
                                  {confirmingDelivery === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  Confirmar recepción
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Confirmar recepción?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Al confirmar, indicas que recibiste el pedido #{formatOrderId(order.id)} satisfactoriamente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleConfirmDelivery(order.id)}>
                                    Sí, lo recibí
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {order.status === 'pending' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={cancellingId === order.id}>
                                  {cancellingId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                  Cancelar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El pedido #{formatOrderId(order.id)} será cancelado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelOrder(order.id)}>
                                    Sí, cancelar pedido
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {(order.status === 'delivered' || order.status === 'cancelled') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReorder(order)}
                              disabled={reorderingId === order.id}
                            >
                              {reorderingId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                              Repetir pedido
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/pedido/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="text-center py-16">
              <CardContent className="space-y-4">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
                  <p className="text-muted-foreground mb-6">
                    ¡Explora nuestros productos y realiza tu primer pedido!
                  </p>
                  <Button onClick={() => navigate('/productos')}>
                    Ver productos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
