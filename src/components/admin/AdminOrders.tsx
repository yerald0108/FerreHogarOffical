import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, Clock, User, MapPin, Phone, CreditCard, Bell, Download, Truck, StickyNote, Search, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminOrders, useUpdateOrderStatus, OrderWithProfile } from '@/hooks/useOrders';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { OrderProgressTracker } from '@/components/OrderProgressTracker';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: 'secondary',
  confirmed: 'default',
  preparing: 'default',
  shipped: 'default',
  delivered: 'secondary',
  cancelled: 'destructive',
};

export function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [cancelModal, setCancelModal] = useState<{ orderId: string; currentStatus: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const toggleHistory = (orderId: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  // Realtime subscription for new orders (only show toast for INSERT events from other users)
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.info('¡Nuevo pedido recibido!', { duration: 4000 });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          // Silently refresh data without duplicate toast (admin already sees success toast)
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleStatusChange = async (orderId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === 'cancelled') {
      setCancelModal({ orderId, currentStatus });
      setCancellationReason('');
      return;
    }
    try {
      await updateStatus.mutateAsync({ 
        id: orderId, 
        status: newStatus as OrderWithProfile['status'],
        previousStatus: currentStatus as OrderWithProfile['status'],
      });
      toast.success('Estado actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancelModal) return;
    if (!cancellationReason.trim()) {
      toast.error('Debes escribir un motivo de cancelación');
      return;
    }
    try {
      await updateStatus.mutateAsync({
        id: cancelModal.orderId,
        status: 'cancelled' as OrderWithProfile['status'],
        previousStatus: cancelModal.currentStatus as OrderWithProfile['status'],
        cancellationReason: cancellationReason.trim(),
      });
      toast.success('Pedido cancelado correctamente');
      setCancelModal(null);
      setCancellationReason('');
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar el pedido');
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.order_items?.some(i => i.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const exportCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) return;
    const headers = ['ID', 'Fecha', 'Cliente', 'Teléfono', 'Dirección', 'Municipio', 'Estado', 'Pago', 'Total', 'Productos'];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
      o.customer_name || '',
      o.phone,
      `"${o.delivery_address}"`,
      o.municipality,
      statusLabels[o.status],
      o.payment_method,
      o.total_amount,
      `"${o.order_items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ') || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pedidos exportados a CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por cliente, # pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm border rounded-md pl-10 pr-3 py-2 bg-background"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pedidos</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground">
          {filteredOrders?.length || 0} pedidos
        </span>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-2"
          onClick={exportCSV}
          disabled={!filteredOrders || filteredOrders.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
      
      <div className="space-y-4">
        {filteredOrders?.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <Badge variant={statusVariants[order.status] || 'secondary'}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(order.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => handleStatusChange(order.id, value, order.status)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{order.customer_name || 'Cliente'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {order.phone}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <span>{order.delivery_address}, {order.municipality}{order.province ? `, ${order.province}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    {order.payment_method} • Entrega: {order.delivery_time}
                  </div>
                </div>
              </div>

              {/* Order Progress Tracker */}
              <div className="border rounded-lg p-4 bg-card">
                <OrderProgressTracker 
                  status={order.status} 
                  statusHistory={(order.order_status_history || []).map(h => ({
                    new_status: h.new_status,
                    created_at: h.created_at,
                  }))}
                />
              </div>

              {/* Status Change History */}
              {order.order_status_history && order.order_status_history.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleHistory(order.id)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <History className="h-4 w-4" />
                    Historial de cambios ({order.order_status_history.length})
                    {expandedHistory.has(order.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {expandedHistory.has(order.id) && (
                    <div className="mt-2 space-y-1.5 pl-6 border-l-2 border-muted ml-2">
                      {[...order.order_status_history]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 text-sm py-1">
                          <div className="flex items-center gap-2 flex-1">
                            {entry.previous_status && (
                              <>
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {statusLabels[entry.previous_status] || entry.previous_status}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                              </>
                            )}
                            <Badge variant={statusVariants[entry.new_status] || 'secondary'} className="text-[10px] h-5">
                              {statusLabels[entry.new_status] || entry.new_status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos ({order.order_items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {item.products?.image_url && (
                          <img 
                            src={item.products.image_url} 
                            alt={item.product_name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-medium">{formatPrice(item.price_at_purchase * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes & Total */}
              {order.notes && (
                <div className="text-sm">
                  <span className="font-medium">Notas:</span>
                  <span className="text-muted-foreground ml-2">{order.notes}</span>
                </div>
              )}

              {/* Tracking Info */}
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <div className="text-sm">
                  <label className="font-medium flex items-center gap-1.5 mb-1">
                    <Truck className="h-4 w-4 text-primary" />
                    Info de seguimiento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Entregado por mensajero Juan, calle 5..."
                    defaultValue={order.tracking_info || ''}
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      if (val !== (order.tracking_info || '')) {
                        await supabase.from('orders').update({ tracking_info: val }).eq('id', order.id);
                        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                      }
                    }}
                    className="w-full text-sm border rounded-md px-3 py-1.5 bg-background"
                  />
                </div>
              )}

              {/* Admin Internal Notes */}
              <div className="text-sm">
                <label className="font-medium flex items-center gap-1.5 mb-1">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  Notas internas (solo admin)
                </label>
                <textarea
                  placeholder="Notas internas sobre este pedido..."
                  defaultValue={order.admin_notes || ''}
                  rows={2}
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    if (val !== (order.admin_notes || '')) {
                      await supabase.from('orders').update({ admin_notes: val }).eq('id', order.id);
                      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                    }
                  }}
                  className="w-full text-sm border rounded-md px-3 py-1.5 bg-background resize-none"
                />
              </div>

              {order.status === 'cancelled' && order.cancellation_reason && (
                <div className="text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <span className="font-medium text-destructive">Motivo de cancelación:</span>
                  <p className="text-muted-foreground mt-1">{order.cancellation_reason}</p>
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-xl font-bold text-primary ml-2">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {filteredOrders?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay pedidos {filterStatus !== 'all' ? 'con ese estado' : ''}
          </div>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      <Dialog open={!!cancelModal} onOpenChange={(open) => { if (!open) setCancelModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              Escribe el motivo por el cual se cancela este pedido. El cliente podrá ver esta razón.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Motivo de cancelación *</Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Ej: Producto agotado, dirección no válida..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModal(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancellation}
              disabled={!cancellationReason.trim() || updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
