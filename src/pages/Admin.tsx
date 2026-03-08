import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Loader2, MessageSquare, Tag, Ticket, Inbox, Star, Image, Menu } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminReports } from '@/components/admin/AdminReports';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminCategories } from '@/components/admin/AdminCategories';
import { AdminCoupons } from '@/components/admin/AdminCoupons';
import { AdminMessages } from '@/components/admin/AdminMessages';
import { AdminTestimonials } from '@/components/admin/AdminTestimonials';
import { AdminBanners } from '@/components/admin/AdminBanners';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const adminSections = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'products', label: 'Productos', icon: Package },
  { value: 'categories', label: 'Categorías', icon: Tag },
  { value: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { value: 'coupons', label: 'Cupones', icon: Ticket },
  { value: 'users', label: 'Usuarios', icon: Users },
  { value: 'reviews', label: 'Reseñas', icon: MessageSquare },
  { value: 'reports', label: 'Reportes', icon: BarChart3 },
  { value: 'messages', label: 'Mensajes', icon: Inbox },
  { value: 'testimonials', label: 'Testimonios', icon: Star },
  { value: 'banners', label: 'Banners', icon: Image },
] as const;

type SectionValue = typeof adminSections[number]['value'];

const sectionComponents: Record<SectionValue, React.FC> = {
  dashboard: AdminDashboard,
  products: AdminProducts,
  categories: AdminCategories,
  orders: AdminOrders,
  coupons: AdminCoupons,
  users: AdminUsers,
  reviews: AdminReviews,
  reports: AdminReports,
  messages: AdminMessages,
  testimonials: AdminTestimonials,
  banners: AdminBanners,
};

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SectionValue>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const activeLabel = adminSections.find(s => s.value === activeSection)?.label ?? 'Dashboard';
  const ActiveComponent = sectionComponents[activeSection];

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-4">
          <div className="container mx-auto px-3">
            <div className="mb-4 flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Abrir menú de secciones">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="px-4 pt-5 pb-2 text-lg font-bold text-foreground">
                    Administración
                  </SheetTitle>
                  <nav className="flex flex-col gap-1 px-2 pb-4">
                    {adminSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.value;
                      return (
                        <button
                          key={section.value}
                          onClick={() => {
                            setActiveSection(section.value);
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {section.label}
                        </button>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="text-xl font-bold text-foreground">{activeLabel}</h1>
                <p className="text-muted-foreground text-xs">Panel de Administración</p>
              </div>
            </div>
            <ActiveComponent />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Gestiona productos, pedidos, usuarios y reportes
            </p>
          </div>
          <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as SectionValue)} className="space-y-6">
            <TabsList className="inline-flex w-auto h-auto flex-wrap gap-0.5">
              {adminSections.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger key={section.value} value={section.value} className="gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {adminSections.map((section) => (
              <TabsContent key={section.value} value={section.value}>
                {React.createElement(sectionComponents[section.value])}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
