import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
  } | null;
}

export interface ProductRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

// Fetch reviews for a product
export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get profiles for reviewers
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return data.map(review => ({
          ...review,
          profile: profileMap.get(review.user_id) || null,
        })) as Review[];
      }
      
      return data as Review[];
    },
    enabled: !!productId,
  });
}

// Calculate product rating statistics
export function useProductRating(productId: string) {
  const { data: reviews } = useProductReviews(productId);
  
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    ratingDistribution[r.rating]++;
  });
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution,
  };
}

// Get current user's review for a product
export function useUserReview(productId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-review', productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!productId && !!user,
  });
}

// Check if user has purchased this product
export function useHasPurchased(productId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['has-purchased', productId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('order_items')
        .select('id, orders!inner(user_id, status)')
        .eq('product_id', productId)
        .eq('orders.user_id', user.id)
        .in('orders.status', ['confirmed', 'preparing', 'shipped', 'delivered'])
        .limit(1);
      
      if (error) {
        console.error('Error checking purchase:', error);
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!productId && !!user,
  });
}

// Create a review
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ productId, rating, comment }: { productId: string; rating: number; comment?: string }) => {
      if (!user) throw new Error('Debes iniciar sesión para dejar una reseña');
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          comment: comment || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.productId] });
    },
  });
}

// Update a review
export function useUpdateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId, rating, comment }: { id: string; productId: string; rating: number; comment?: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating, comment: comment || null })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.productId] });
    },
  });
}

// Delete a review
export function useDeleteReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.productId] });
    },
  });
}
