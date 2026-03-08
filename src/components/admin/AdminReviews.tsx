import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, Star, Trash2, User, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdminReview {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  profile?: { full_name: string } | null;
  product?: { name: string; image_url: string | null } | null;
}

function useAdminReviews() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async (): Promise<AdminReview[]> => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Get profiles and products
      const userIds = [...new Set(data.map(r => r.user_id))];
      const productIds = [...new Set(data.map(r => r.product_id))];

      const [profilesRes, productsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
        supabase.from('products').select('id, name, image_url').in('id', productIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const productMap = new Map(productsRes.data?.map(p => [p.id, p]) || []);

      return data.map(review => ({
        ...review,
        is_visible: (review as any).is_visible ?? true,
        profile: profileMap.get(review.user_id) || null,
        product: productMap.get(review.product_id) || null,
      }));
    },
  });
}

export function AdminReviews() {
  const { data: reviews, isLoading } = useAdminReviews();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden'>('all');
  const queryClient = useQueryClient();

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_visible } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Reseña eliminada');
    },
  });

  const handleToggle = async (id: string, currentVisible: boolean) => {
    try {
      await toggleVisibility.mutateAsync({ id, is_visible: !currentVisible });
      toast.success(!currentVisible ? 'Reseña visible' : 'Reseña oculta');
    } catch {
      toast.error('Error al cambiar visibilidad');
    }
  };

  const filteredReviews = reviews?.filter(r => {
    const matchesSearch =
      r.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterVisibility === 'visible') return matchesSearch && r.is_visible;
    if (filterVisibility === 'hidden') return matchesSearch && !r.is_visible;
    return matchesSearch;
  });

  const stats = {
    total: reviews?.length || 0,
    visible: reviews?.filter(r => r.is_visible).length || 0,
    hidden: reviews?.filter(r => !r.is_visible).length || 0,
    avgRating: reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Reseñas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.avgRating}</p>
          <p className="text-xs text-muted-foreground">Rating Promedio</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{stats.visible}</p>
          <p className="text-xs text-muted-foreground">Visibles</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.hidden}</p>
          <p className="text-xs text-muted-foreground">Ocultas</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, producto o comentario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'visible', 'hidden'] as const).map((f) => (
            <Button
              key={f}
              variant={filterVisibility === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterVisibility(f)}
            >
              {f === 'all' ? 'Todas' : f === 'visible' ? 'Visibles' : 'Ocultas'}
            </Button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews?.map((review) => (
          <Card
            key={review.id}
            className={`p-4 transition-opacity ${!review.is_visible ? 'opacity-60' : ''}`}
          >
            <div className="flex gap-4">
              {/* Product Image */}
              {review.product?.image_url && (
                <img
                  src={review.product.image_url}
                  alt={review.product.name || ''}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {review.product?.name || 'Producto eliminado'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {review.profile?.full_name || 'Usuario desconocido'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!review.is_visible && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Oculta
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-accent text-accent'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-foreground mt-2 line-clamp-3">{review.comment}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`visibility-${review.id}`}
                      checked={review.is_visible}
                      onCheckedChange={() => handleToggle(review.id, review.is_visible)}
                      disabled={toggleVisibility.isPending}
                    />
                    <Label htmlFor={`visibility-${review.id}`} className="text-xs text-muted-foreground cursor-pointer">
                      {review.is_visible ? 'Visible' : 'Oculta'}
                    </Label>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive h-8">
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta reseña?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente la reseña de{' '}
                          <strong>{review.profile?.full_name}</strong> sobre{' '}
                          <strong>{review.product?.name}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReview.mutate(review.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredReviews?.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron reseñas</p>
          </div>
        )}
      </div>
    </div>
  );
}
