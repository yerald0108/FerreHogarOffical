import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, ZoomIn, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ProductGalleryProps {
  mainImage: string | null;
  additionalImages: { id: string; image_url: string; display_order: number }[];
  productName: string;
}

export function ProductGallery({ mainImage, additionalImages, productName }: ProductGalleryProps) {
  // Build full image list: main image first, then additional sorted by display_order
  const allImages = [
    ...(mainImage ? [{ id: 'main', image_url: mainImage, display_order: -1 }] : []),
    ...additionalImages.sort((a, b) => a.display_order - b.display_order),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const currentImage = allImages[selectedIndex];
  const hasMultiple = allImages.length > 1;

  const goTo = useCallback((index: number) => {
    setSelectedIndex(Math.max(0, Math.min(index, allImages.length - 1)));
  }, [allImages.length]);

  const goNext = useCallback(() => goTo(selectedIndex + 1), [selectedIndex, goTo]);
  const goPrev = useCallback(() => goTo(selectedIndex - 1), [selectedIndex, goTo]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, goNext, goPrev]);

  const handleImgError = (id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  };

  if (allImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <Package className="h-20 w-20 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-lg bg-muted group cursor-pointer"
        onClick={() => setLightboxOpen(true)}
      >
        {imgErrors.has(currentImage.id) ? (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <Package className="h-20 w-20 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={currentImage.image_url}
            alt={`${productName} - Imagen ${selectedIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => handleImgError(currentImage.id)}
          />
        )}

        {/* Zoom hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2">
            <ZoomIn className="h-5 w-5 text-foreground" />
          </div>
        </div>

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              disabled={selectedIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              disabled={selectedIndex === allImages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots indicator */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === selectedIndex
                    ? 'bg-primary w-4'
                    : 'bg-background/70 hover:bg-background'
                )}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              className={cn(
                'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                i === selectedIndex
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
              onClick={() => goTo(i)}
            >
              {imgErrors.has(img.id) ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={img.image_url}
                  alt={`${productName} - Miniatura ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImgError(img.id)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95 [&>button]:hidden" aria-describedby={undefined}>
          <VisuallyHidden><DialogTitle>{productName} - Galería</DialogTitle></VisuallyHidden>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Counter */}
            {hasMultiple && (
              <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                {selectedIndex + 1} / {allImages.length}
              </div>
            )}

            {/* Image with pinch-to-zoom */}
            <img
              src={currentImage.image_url}
              alt={`${productName} - Imagen ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain touch-manipulation"
              style={{ touchAction: 'pinch-zoom' }}
            />

            {/* Navigation */}
            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goPrev}
                  disabled={selectedIndex === 0}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goNext}
                  disabled={selectedIndex === allImages.length - 1}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Thumbnail strip in lightbox */}
            {hasMultiple && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                {allImages.map((img, i) => (
                  <button
                    key={img.id}
                    className={cn(
                      'shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all',
                      i === selectedIndex
                        ? 'border-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                    onClick={() => goTo(i)}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
