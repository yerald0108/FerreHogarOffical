import { useState, useCallback, ImgHTMLAttributes } from 'react';
import { Package } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  src: string;
  alt: string;
  fallbackIcon?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackIcon = true,
  className = '',
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  const handleError = useCallback(() => setError(true), []);

  if (error && fallbackIcon) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  // Generate srcSet for Supabase storage images
  const generateSrcSet = () => {
    if (!src || src.includes('placeholder') || src.includes('unsplash')) return undefined;
    // If it's a supabase storage URL, we could add transforms in the future
    return undefined;
  };

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      srcSet={generateSrcSet()}
      onError={handleError}
      className={className}
      {...props}
    />
  );
}
