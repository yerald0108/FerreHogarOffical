import { Bell, CheckCheck, Package, ShoppingCart, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useUnreadCount, useMarkAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();

  const handleClick = (notif: any) => {
    if (!notif.is_read) markAsRead.mutate(notif.id);
    if (notif.reference_id) {
      setOpen(false);
      if (notif.type === 'new_order' && isAdmin) {
        navigate('/admin?tab=orders');
      } else if (notif.type === 'order_update') {
        navigate(`/pedido/${notif.reference_id}`);
      }
    }
  };

  const handleMarkAllRead = () => {
    markAsRead.mutate(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px] animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No tienes notificaciones
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 ${
                    !notif.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    !notif.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {notif.type === 'new_order' ? <ShoppingCart className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification.mutate(notif.id);
                    }}
                    className="shrink-0 mt-1 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Eliminar notificación"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
