import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Zap, Eye, Package, Star } from 'lucide-react';
import { Product, useCartStore } from '@/lib/store';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { StarRating } from '@/components/reviews/StarRating';
import { FavoriteButton } from '@/components/FavoriteButton';

interface QuickViewProps {
  product: Product & { compare_at_price?: number };
  rating?: { averageRating: number; totalReviews: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(price);

export function QuickView({ product, rating, open, onOpenChange }: QuickViewProps) {
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity}x ${product.name} añadido al carrito`);
    setQuantity(1);
    onOpenChange(false);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    setQuantity(1);
    onOpenChange(false);
    navigate('/checkout');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg pr-6">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <FavoriteButton productId={product.id} variant="overlay" />
            {product.stock === 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2">Agotado</Badge>
            )}
            {product.compare_at_price && product.compare_at_price > product.price && (
              <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-600 text-white">
                -{Math.round((product.compare_at_price - product.price) / product.compare_at_price * 100)}%
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between gap-3">
            {product.category && (
              <Badge variant="secondary" className="w-fit">{product.category}</Badge>
            )}

            {rating && rating.totalReviews > 0 && (
              <StarRating rating={rating.averageRating} showValue totalReviews={rating.totalReviews} size="sm" />
            )}

            <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
            </div>

            {product.stock > 0 ? (
              <div className="space-y-2 mt-auto">
                <Button onClick={handleAddToCart} className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Añadir al carrito
                </Button>
                <Button onClick={handleBuyNow} variant="secondary" className="w-full gap-2">
                  <Zap className="h-4 w-4" />
                  Comprar ahora
                </Button>
              </div>
            ) : (
              <Button variant="secondary" disabled className="w-full mt-auto">Agotado</Button>
            )}

            <Link
              to={`/producto/${product.id}`}
              onClick={() => onOpenChange(false)}
              className="text-xs text-primary hover:underline text-center flex items-center justify-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Ver todos los detalles
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
