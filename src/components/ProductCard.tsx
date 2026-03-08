import { ShoppingCart, Package, Eye } from 'lucide-react';
import { useState, useEffect, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product, useCartStore } from '@/lib/store';
import { toast } from 'sonner';
import { StarRating } from '@/components/reviews/StarRating';
import { useProductRating } from '@/hooks/useReviews';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useProductPrices, formatCurrencyPrice, ProductPrice } from '@/hooks/useProductPrices';
import { BulkRating } from '@/hooks/useBulkRatings';
import { QuickView } from '@/components/QuickView';

interface ProductCardProps {
  product: Product;
  index?: number;
  bulkRating?: BulkRating;
  bulkPrices?: ProductPrice[];
  bulkMode?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
  }).format(price);
};

export const ProductCard = memo(function ProductCard({ product, index = 0, bulkRating, bulkPrices, bulkMode = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  const individualRating = useProductRating(bulkMode ? '' : product.id);
  const { data: individualPrices } = useProductPrices(bulkMode ? '' : product.id);
  
  const averageRating = bulkRating?.averageRating ?? individualRating.averageRating;
  const totalReviews = bulkRating?.totalReviews ?? individualRating.totalReviews;
  const extraPrices = bulkPrices ?? individualPrices ?? [];

  const [imgError, setImgError] = useState(false);
  const [currentPriceIndex, setCurrentPriceIndex] = useState(0);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const rateLimited = useRateLimit(800);

  useEffect(() => {
    if (extraPrices.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPriceIndex(prev => (prev + 1) % extraPrices.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [extraPrices.length]);

  const handleAddToCart = rateLimited(() => {
    addItem(product);
    toast.success(`${product.name} añadido al carrito`);
  });

  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <>
    <QuickView
      product={product}
      rating={totalReviews > 0 ? { averageRating, totalReviews } : undefined}
      open={quickViewOpen}
      onOpenChange={setQuickViewOpen}
    />
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in flex flex-col h-full"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
    >
      <Link to={`/producto/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imgError ? (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImgError}
            />
          )}
          <FavoriteButton productId={product.id} variant="overlay" />
          <button
            onClick={(e) => { e.preventDefault(); setQuickViewOpen(true); }}
            className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-card shadow-sm border"
            aria-label="Vista rápida"
          >
            <Eye className="h-4 w-4 text-foreground" />
          </button>
          {product.stock === 0 ? (
            <Badge variant="destructive" className="absolute top-1.5 right-1.5 md:top-2 md:right-2 text-[10px] md:text-xs">
              Agotado
            </Badge>
          ) : product.stock < 10 ? (
            <Badge variant="destructive" className="absolute top-1.5 right-1.5 md:top-2 md:right-2 text-[10px] md:text-xs">
              ¡Últimas!
            </Badge>
          ) : null}
          {'compare_at_price' in product && (product as any).compare_at_price > product.price && (
            <Badge className="absolute top-1.5 left-1.5 md:top-2 md:left-2 text-[10px] md:text-xs bg-red-600 hover:bg-red-600">
              -{Math.round(((product as any).compare_at_price - product.price) / (product as any).compare_at_price * 100)}%
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-2.5 md:p-4 flex-1 flex flex-col">
        <Link to={`/producto/${product.id}`}>
          <h3 className="font-semibold text-foreground line-clamp-2 h-[2rem] md:h-[2.5rem] text-xs md:text-base hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>
        <div className="h-4 md:h-5 mt-0.5 md:mt-1">
          {totalReviews > 0 && (
            <StarRating rating={averageRating} size="sm" showValue totalReviews={totalReviews} />
          )}
        </div>
        <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1 hidden md:block h-0 md:h-5">
          {product.description}
        </p>
        <div className="mt-auto pt-1.5 md:pt-3 space-y-0.5 md:space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base md:text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {(product as any).compare_at_price && (product as any).compare_at_price > product.price && (
                <span className="text-[10px] md:text-xs text-muted-foreground line-through">
                  {formatPrice((product as any).compare_at_price)}
                </span>
              )}
            </div>
            <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">
              {product.stock} disp.
            </span>
          </div>
          <div className="relative h-4 md:h-5 overflow-hidden">
            {extraPrices.length > 0 && extraPrices.map((ep, idx) => (
              <div
                key={ep.id}
                className={`absolute inset-0 flex items-center transition-all duration-500 ${
                  idx === currentPriceIndex
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-3'
                }`}
              >
                <Badge variant="outline" className="text-[10px] md:text-xs font-medium">
                  {formatCurrencyPrice(ep.price, ep.currency)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-2.5 pt-0 md:p-4 md:pt-0 mt-auto">
        <Button
          onClick={handleAddToCart}
          className="w-full gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-10"
          disabled={product.stock === 0}
          variant={product.stock === 0 ? "secondary" : "default"}
        >
          {product.stock === 0 ? (
            <>Agotado</>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Añadir al carrito</span>
              <span className="sm:hidden">Añadir</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
    </>
  );
});
