import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { useCreateReview, useUpdateReview, Review } from '@/hooks/useReviews';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  existingReview?: Review | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  
  const isSubmitting = createReview.isPending || updateReview.isPending;
  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          id: existingReview.id,
          productId,
          rating,
          comment,
        });
        toast.success('Reseña actualizada');
      } else {
        await createReview.mutateAsync({
          productId,
          rating,
          comment,
        });
        toast.success('¡Gracias por tu reseña!');
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la reseña');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tu calificación
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>
      
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
          Tu comentario (opcional)
        </label>
        <Textarea
          id="comment"
          placeholder="Cuéntanos tu experiencia con este producto..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/1000 caracteres
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Actualizar reseña' : 'Enviar reseña'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
