import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  image_url: string | null;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  salesByDate: { date: string; total: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  lowStockProducts: LowStockProduct[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Get orders with items for sales calculation
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)');
      
      if (ordersError) throw ordersError;

      // Get products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (productsError) throw productsError;

      // Get low stock products (stock <= 10)
      const { data: lowStock, error: lowStockError } = await supabase
        .from('products')
        .select('id, name, stock, image_url')
        .eq('is_active', true)
        .lte('stock', 10)
        .order('stock', { ascending: true })
        .limit(10);
      
      if (lowStockError) throw lowStockError;

      // Get users count from profiles
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;

      // Calculate stats
      const totalSales = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

      // Sales by date (last 7 days)
      const salesByDate = calculateSalesByDate(orders || []);

      // Top products
      const topProducts = calculateTopProducts(orders || []);

      // Orders by status
      const ordersByStatus = calculateOrdersByStatus(orders || []);

      return {
        totalSales,
        totalOrders,
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        pendingOrders,
        salesByDate,
        topProducts,
        ordersByStatus,
        lowStockProducts: lowStock || [],
      };
    },
    refetchInterval: 30_000, // Auto-refresh every 30 seconds for live metrics
  });
}

function calculateSalesByDate(orders: any[]): { date: string; total: number }[] {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const salesMap = new Map<string, number>();
  last7Days.forEach(date => salesMap.set(date, 0));

  orders.forEach(order => {
    const date = order.created_at.split('T')[0];
    if (salesMap.has(date)) {
      salesMap.set(date, (salesMap.get(date) || 0) + order.total_amount);
    }
  });

  return last7Days.map(date => ({
    date,
    total: salesMap.get(date) || 0,
  }));
}

function calculateTopProducts(orders: any[]): { name: string; quantity: number; revenue: number }[] {
  const productMap = new Map<string, { quantity: number; revenue: number }>();

  orders.forEach(order => {
    order.order_items?.forEach((item: any) => {
      const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
      productMap.set(item.product_name, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.price_at_purchase * item.quantity),
      });
    });
  });

  return Array.from(productMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function calculateOrdersByStatus(orders: any[]): { status: string; count: number }[] {
  const statusMap = new Map<string, number>();
  
  orders.forEach(order => {
    statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
  });

  return Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }));
}

// Hook for user management
export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  province: string | null;
  municipality: string | null;
  created_at: string;
  role: 'admin' | 'user' | 'gestor';
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles?.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        province: profile.province,
        municipality: profile.municipality,
        created_at: profile.created_at,
        role: (roleMap.get(profile.user_id) as 'admin' | 'user' | 'gestor') || 'user',
      })) || [];
    },
  });
}
