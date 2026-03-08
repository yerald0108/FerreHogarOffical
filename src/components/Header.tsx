import { ShoppingCart, User, Menu, Wrench, X, LogOut, Shield, Package, UserCircle, Heart, Sun, Moon, Store, Search, Clock, LogIn } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Separator } from '@/components/ui/separator';
import { useNewFavoritesBadge } from '@/hooks/useNewFavoritesBadge';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [animateBadge, setAnimateBadge] = useState(false);
  const prevTotalRef = useRef(totalItems);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isGestor, signOut } = useAuth();
  const { data: profile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();
  const avatarUrl = (profile as any)?.avatar_url;
  const { newCount: newFavoritesCount } = useNewFavoritesBadge();
  // Active orders count
  const { data: activeOrdersCount = 0 } = useQuery({
    queryKey: ['active-orders-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'shipped']);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Animate badge when totalItems changes
  useEffect(() => {
    if (totalItems !== prevTotalRef.current && totalItems > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 500);
      prevTotalRef.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  // Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/productos', label: 'Productos' },
    { href: '/nosotros', label: 'Nosotros' },
    { href: '/contacto', label: 'Contacto' },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
  };

  return (
    <>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex h-14 md:h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">FerreHogar</h1>
                <p className="text-xs text-muted-foreground">Tu ferretería en casa</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                className="h-9 w-9"
              >
                <Search className="h-5 w-5" />
              </Button>

              {!user && (
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema" className="hidden md:inline-flex">
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              )}

              {/* Notifications - hidden on mobile (shown in bottom nav) */}
              {user && (
                <div className="hidden md:block">
                  <NotificationBell />
                </div>
              )}
              
              {/* Cart - hidden on mobile (shown in bottom nav) */}
              <Link to="/carrito" className="hidden md:inline-flex">
                <Button variant="ghost" size="icon" className="relative" aria-label={`Carrito${totalItems > 0 ? ` (${totalItems} productos)` : ''}`}>
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className={`absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ${animateBadge ? 'animate-bounce' : ''}`}>
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              {/* Desktop user menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex h-9 w-9" aria-label="Menú de usuario">
                      {avatarUrl ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatarUrl} alt="Perfil" />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favoritos" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Mis Favoritos
                        {newFavoritesCount > 0 && (
                          <Badge className="ml-auto h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {newFavoritesCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/mis-pedidos" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Mis Pedidos
                        {activeOrdersCount > 0 && (
                          <Badge className="ml-auto h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {activeOrdersCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Panel Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isGestor && !isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/gestionar" className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Gestionar
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2">
                      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="hidden md:inline-flex">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </Button>
                </Link>
              )}
              
              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px] p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              FerreHogar
            </SheetTitle>
          </SheetHeader>

          {user && (
            <div className="px-4 py-2 mb-1">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}

          <Separator />

          <div className="flex flex-col py-2">
            {navLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  to={link.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          {user && (
            <>
              <Separator />
              <div className="flex flex-col py-2">
                <SheetClose asChild>
                  <Link to="/perfil" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    Mi Perfil
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/favoritos" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    Mis Favoritos
                    {newFavoritesCount > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                        {newFavoritesCount}
                      </Badge>
                    )}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/mis-pedidos" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Mis Pedidos
                    {activeOrdersCount > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                        {activeOrdersCount}
                      </Badge>
                    )}
                  </Link>
                </SheetClose>
                {isAdmin && (
                  <SheetClose asChild>
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Panel Admin
                    </Link>
                  </SheetClose>
                )}
                {isGestor && !isAdmin && (
                  <SheetClose asChild>
                    <Link to="/gestionar" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      Gestionar
                    </Link>
                  </SheetClose>
                )}
              </div>
            </>
          )}

          <Separator />
          <div className="flex flex-col py-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted w-full text-left"
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
            </button>
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-muted w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            ) : (
              <SheetClose asChild>
                <Link to="/login" className="flex items-center gap-3 px-4 py-3 text-sm text-primary font-medium hover:bg-muted">
                  <User className="h-4 w-4" />
                  Iniciar Sesión
                </Link>
              </SheetClose>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
