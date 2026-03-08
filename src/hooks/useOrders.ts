import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

export type Order = Tables<'orders'> & {
  order_items?: OrderItem[];
  order_status_history?: Tables<'order_status_history'>[];
};

export type OrderWithProfile = Order & {
  customer_name?: string;
  customer_email?: string;
};

export type OrderItem = Tables<'order_items'> & {
  products?: Tables<'products'> | null;
};

// Fetch user's orders
export function useUserOrders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*)), order_status_history(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });
}

// Fetch all orders for admin with profile info
export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      // First get orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*)), order_status_history(*)')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Then get profiles for those orders
      const userIds = [...new Set(orders.map(o => o.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Map profiles to orders
      const profileMap = new Map(profiles.map(p => [p.user_id, p]));
      
      return orders.map(order => ({
        ...order,
        customer_name: profileMap.get(order.user_id)?.full_name,
        customer_email: profileMap.get(order.user_id)?.email,
      })) as OrderWithProfile[];
    },
  });
}

// Create order
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      order, 
      items 
    }: { 
      order: Omit<TablesInsert<'orders'>, 'id' | 'created_at' | 'updated_at'>; 
      items: Omit<TablesInsert<'order_items'>, 'id' | 'created_at' | 'order_id'>[] 
    }) => {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        ...item,
        order_id: orderData.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, previousStatus, cancellationReason }: { id: string; status: Tables<'orders'>['status']; previousStatus?: Tables<'orders'>['status']; cancellationReason?: string }) => {
      const updateData: any = { status };
      if (status === 'cancelled' && cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Send status update email notification (fire and forget)
      if (previousStatus && previousStatus !== status) {
        supabase.functions.invoke('send-order-status-update', {
          body: {
            orderId: id,
            newStatus: status,
            previousStatus: previousStatus,
          },
        }).then(() => {
          console.log('Order status update email sent');
        }).catch((emailError) => {
          console.error('Error sending status update email:', emailError);
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}
