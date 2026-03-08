import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            image_url,
            stock,
            description,
            is_active,
            categories (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Debes iniciar sesión');
      
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este producto ya está en tus favoritos');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast.success('Añadido a favoritos');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Debes iniciar sesión');
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast.success('Eliminado de favoritos');
    },
    onError: () => {
      toast.error('Error al eliminar de favoritos');
    },
  });

  const isFavorite = (productId: string) => {
    return favorites.some((fav) => fav.product_id === productId);
  };

  const toggleFavorite = (productId: string) => {
    if (isFavorite(productId)) {
      removeFavorite.mutate(productId);
    } else {
      addFavorite.mutate(productId);
    }
  };

  return {
    favorites,
    isLoading,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    isFavorite,
    toggleFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}
