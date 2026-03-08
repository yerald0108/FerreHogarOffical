import { useState } from 'react';
import { StarRating } from './StarRating';
import { Review, useDeleteReview, useProductRating } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Edit2, User, BadgeCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
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

interface ReviewListProps {
  productId: string;
  reviews: Review[];
  onEditReview?: () => void;
  purchasedUserIds?: string[];
}

export function ReviewList({ productId, reviews, onEditReview, purchasedUserIds = [] }: ReviewListProps) {
  const { user } = useAuth();
  const deleteReview = useDeleteReview();
  const rating = useProductRating(productId);

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview.mutateAsync({ id: reviewId, productId });
      toast.success('Reseña eliminada');
    } catch (error) {
      toast.error('Error al eliminar la reseña');
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Este producto aún no tiene reseñas.</p>
        <p className="text-sm mt-1">¡Sé el primero en opinar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="text-5xl font-bold text-foreground">
                {rating.averageRating.toFixed(1)}
              </div>
              <StarRating rating={rating.averageRating} size="lg" />
              <p className="text-sm text-muted-foreground mt-2">
                Basado en {rating.totalReviews} {rating.totalReviews === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>
            
            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = rating.ratingDistribution[stars] || 0;
                const percentage = rating.totalReviews > 0 
                  ? (count / rating.totalReviews) * 100 
                  : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{stars}</span>
                    <StarRating rating={1} maxRating={1} size="sm" />
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const isOwn = user?.id === review.user_id;
          
          return (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {review.profile?.full_name || 'Usuario'}
                        </span>
                        <StarRating rating={review.rating} size="sm" />
                        {purchasedUserIds.includes(review.user_id) && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <BadgeCheck className="h-3 w-3" />
                            Compra verificada
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        {review.updated_at !== review.created_at && ' (editada)'}
                      </p>
                      {review.comment && (
                        <p className="text-foreground mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                  
                  {isOwn && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEditReview}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Tu reseña será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(review.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
