import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Loader2, MessageSquare, Tag, Ticket, Inbox, Star, Image } from 'lucide-react';
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

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();

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
          
          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 scrollbar-thin">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 h-auto flex-wrap md:flex-nowrap gap-0.5 md:gap-0">
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Productos</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="hidden sm:inline">Categorías</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Pedidos</span>
                </TabsTrigger>
                <TabsTrigger value="coupons" className="gap-2">
                  <Ticket className="h-4 w-4" />
                  <span className="hidden sm:inline">Cupones</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuarios</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Reseñas</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Reportes</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="gap-2">
                  <Inbox className="h-4 w-4" />
                  <span className="hidden sm:inline">Mensajes</span>
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="gap-2">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Testimonios</span>
                </TabsTrigger>
                <TabsTrigger value="banners" className="gap-2">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Banners</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>
            
            <TabsContent value="products">
              <AdminProducts />
            </TabsContent>
            
            <TabsContent value="categories">
              <AdminCategories />
            </TabsContent>
            
            <TabsContent value="orders">
              <AdminOrders />
            </TabsContent>

            <TabsContent value="coupons">
              <AdminCoupons />
            </TabsContent>
            
            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>
            
            <TabsContent value="reviews">
              <AdminReviews />
            </TabsContent>
            
            <TabsContent value="reports">
              <AdminReports />
            </TabsContent>

            <TabsContent value="messages">
              <AdminMessages />
            </TabsContent>

            <TabsContent value="testimonials">
              <AdminTestimonials />
            </TabsContent>

            <TabsContent value="banners">
              <AdminBanners />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
