import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  productId: string;
  variant?: 'icon' | 'overlay';
  className?: string;
}

export function FavoriteButton({ productId, variant = 'icon', className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    toggleFavorite(productId);
  };

  const isActive = isFavorite(productId);

  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        disabled={isToggling}
        className={cn(
          'absolute top-2 left-2 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background hover:scale-110',
          isToggling && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-label={isActive ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-colors',
            isActive ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-destructive'
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isToggling}
      className={className}
      aria-label={isActive ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          isActive ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-destructive'
        )}
      />
    </Button>
  );
}
