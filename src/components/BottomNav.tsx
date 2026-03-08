import { Home, ShoppingCart, User, Grid3X3, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';

export function BottomNav() {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();

  // Don't show on admin pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/gestionar')) {
    return null;
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/productos', icon: Grid3X3, label: 'Productos' },
    { href: '/carrito', icon: ShoppingCart, label: 'Carrito', badgeCount: totalItems },
    ...(user ? [{ href: '/notificaciones', icon: Bell, label: 'Alertas', badgeCount: unreadCount }] : []),
    { href: user ? '/perfil' : '/login', icon: User, label: 'Cuenta' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.href === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {(item.badgeCount ?? 0) > 0 && (
                  <Badge className="absolute -right-2.5 -top-2 h-4 min-w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                    {item.badgeCount! > 9 ? '9+' : item.badgeCount}
                  </Badge>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}