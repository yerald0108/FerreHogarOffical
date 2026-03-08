import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';
import { useInfiniteNotifications, useUnreadCount, useMarkAsRead } from '@/hooks/useNotifications';
import { Bell, CheckCheck, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Navigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

export default function Notifications() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const notifications = useMemo(() => data?.pages.flat() ?? [], [data]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  const handleClick = (notif: any) => {
    if (!notif.is_read) markAsRead.mutate(notif.id);
    if (notif.reference_id) {
      if (notif.type === 'new_order' && isAdmin) {
        navigate('/admin?tab=orders');
      } else if (notif.type === 'order_update') {
        navigate(`/pedido/${notif.reference_id}`);
      }
    }
  };

  return (
    <PageTransition>
      <SEOHead title="Notificaciones" description="Revisa las actualizaciones de tus pedidos y alertas." />
      <Header />
      <main className="container mx-auto px-4 py-6 min-h-screen pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => markAsRead.mutate(undefined)}>
              <CheckCheck className="h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No tienes notificaciones</p>
            <p className="text-sm mt-1">Aquí aparecerán las actualizaciones de tus pedidos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left p-4 rounded-lg border transition-colors flex gap-3 ${
                  !notif.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:bg-muted/50'
                }`}
              >
                <div className={`mt-0.5 shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  !notif.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {notif.type === 'new_order' ? <ShoppingCart className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <Badge variant="default" className="h-5 text-[10px] px-1.5">Nueva</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </button>
            ))}

            {hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2"
                >
                  {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cargar más notificaciones
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </PageTransition>
  );
}
