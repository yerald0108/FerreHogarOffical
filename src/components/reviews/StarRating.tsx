import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  totalReviews?: number;
}

import { forwardRef } from 'react';

export const StarRating = forwardRef<HTMLDivElement, StarRatingProps>(function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  totalReviews,
}, ref) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div ref={ref} className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(rating);
          const partial = index === Math.floor(rating) && rating % 1 !== 0;
          const fillPercentage = partial ? (rating % 1) * 100 : 0;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              disabled={!interactive}
              className={cn(
                'relative transition-transform',
                interactive && 'cursor-pointer hover:scale-110',
                !interactive && 'cursor-default'
              )}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-muted-foreground/30'
                )}
              />
              {/* Filled star overlay */}
              {(filled || partial) && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'absolute inset-0 text-yellow-500 fill-yellow-500'
                  )}
                  style={partial ? {
                    clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`
                  } : undefined}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {totalReviews !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
        </span>
      )}
    </div>
  );
});
StarRating.displayName = "StarRating";
