import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageTransition } from '@/components/PageTransition';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowLeft, Package, MessageSquare, Minus, Plus, CreditCard, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductDetailSkeleton } from '@/components/skeletons/ProductDetailSkeleton';
import { ProductGallery } from '@/components/ProductGallery';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { RelatedProducts } from '@/components/RelatedProducts';
import { useProductReviews, useUserReview, useProductRating, useHasPurchased } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { SEOHead } from '@/components/SEOHead';
import { StockAlertForm } from '@/components/StockAlertForm';
import { MiniCart } from '@/components/MiniCart';
import { useProductPrices, formatCurrencyPrice } from '@/hooks/useProductPrices';
import { Coins } from 'lucide-react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { ShareButton } from '@/components/ShareButton';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { useRecentlyViewedStore } from '@/hooks/useRecentlyViewed';
import { useNavigate } from 'react-router-dom';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import { ProductViewTracker } from '@/components/ProductViewTracker';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const rateLimited = useRateLimit(800);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.add);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) addRecentlyViewed(id);
  }, [id]);

  // Fetch product
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch additional images
  const { data: additionalImages = [] } = useQuery({
    queryKey: ['product-images', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id!)
        .order('display_order');
      if (error) throw error;
      return data as { id: string; image_url: string; display_order: number }[];
    },
    enabled: !!id,
  });

  // Fetch extra prices
  const { data: extraPrices = [] } = useProductPrices(id || '');

  // Fetch payment methods for product
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['product-payment-methods', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_payment_methods')
        .select('method')
        .eq('product_id', id!);
      if (error) throw error;
      return data.map(d => d.method);
    },
    enabled: !!id,
  });

  // Fetch reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(id || '');
  const { data: userReview } = useUserReview(id || '');
  const { data: hasPurchased } = useHasPurchased(id || '');
  const rating = useProductRating(id || '');

  // Get verified purchasers for reviews
  const { data: purchasedUserIds = [] } = useQuery({
    queryKey: ['review-purchasers', id],
    queryFn: async () => {
      if (!reviews || reviews.length === 0) return [];
      const reviewerIds = reviews.map(r => r.user_id);
      const { data } = await supabase
        .from('order_items')
        .select('orders!inner(user_id, status)')
        .eq('product_id', id!)
        .in('orders.status', ['confirmed', 'preparing', 'shipped', 'delivered']);
      
      if (!data) return [];
      const purchaserSet = new Set(data.map((d: any) => d.orders.user_id));
      return reviewerIds.filter(uid => purchaserSet.has(uid));
    },
    enabled: !!id && reviews.length > 0,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = rateLimited(() => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '/placeholder.svg',
        description: product.description || '',
        category: product.categories?.name || '',
        stock: product.stock,
      }, quantity);
      toast.success(`${quantity}x ${product.name} añadido al carrito`);
      setMiniCartOpen(true);
      setQuantity(1);
    }
  });

  if (productLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Producto no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              El producto que buscas no existe o ya no está disponible
            </p>
            <Link to="/productos">
              <Button size="lg">Ver Productos</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const canReview = user && hasPurchased && !userReview;
  const hasUserReview = !!userReview;

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title={product.name}
        description={product.description || `Compra ${product.name} en FerreHogar`}
        image={product.image_url || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || '',
          image: product.image_url || undefined,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "CUP",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
          ...(rating.totalReviews > 0 ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating.averageRating,
              reviewCount: rating.totalReviews,
            }
          } : {}),
        }}
      />
      <MiniCart open={miniCartOpen} onOpenChange={setMiniCartOpen} />
      <ProductViewTracker productId={product.id} />
      <Header />
      
      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[
            { label: 'Productos', href: '/productos' },
            ...(product.categories ? [{ label: product.categories.name, href: `/productos?categoria=${product.categories.name}` }] : []),
            { label: product.name },
          ]} />

          {/* Product Info */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
            {/* Image Gallery */}
            <div className="relative">
              <ProductGallery
                mainImage={product.image_url}
                additionalImages={additionalImages}
                productName={product.name}
              />
              {product.stock === 0 ? (
                <Badge variant="destructive" className="absolute top-4 right-4 text-sm md:text-lg px-3 py-1 md:px-4 md:py-2 z-10">
                  Agotado
                </Badge>
              ) : product.stock < 10 ? (
                <Badge variant="destructive" className="absolute top-4 right-4 z-10">
                  ¡Últimas unidades!
                </Badge>
              ) : null}
            </div>

            {/* Details */}
            <div className="space-y-4 md:space-y-6">
              {product.categories && (
                <Badge variant="secondary">{product.categories.name}</Badge>
              )}
              
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.name}</h1>
                <ShareButton title={product.name} className="shrink-0 mt-1" />
              </div>
              
              {rating.totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={rating.averageRating} showValue totalReviews={rating.totalReviews} />
                </div>
              )}

              <p className="text-base md:text-lg text-muted-foreground">{product.description}</p>
              
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                    <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground">
                      -{Math.round((product.compare_at_price - product.price) / product.compare_at_price * 100)}%
                    </Badge>
                  </>
                )}
              </div>

              {extraPrices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extraPrices.map((ep) => (
                    <Badge key={ep.id} variant="outline" className="text-sm px-3 py-1 gap-1.5">
                      <Coins className="h-3.5 w-3.5" />
                      {formatCurrencyPrice(ep.price, ep.currency)}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-5 w-5" />
                <span>
                  {product.stock === 0 
                    ? 'Sin stock disponible' 
                    : `${product.stock} unidades disponibles`
                  }
                </span>
              </div>

              <Separator />

              {/* Payment methods */}
              {paymentMethods.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Métodos de pago aceptados
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {paymentMethods.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs capitalize">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector + Desktop add-to-cart */}
              <div className="hidden md:block space-y-3">
                {product.stock === 0 ? (
                  <div className="space-y-3">
                    <Button size="lg" className="w-full" variant="secondary" disabled>
                      Producto Agotado
                    </Button>
                    <StockAlertForm productId={product.id} productName={product.name} />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">Cantidad:</span>
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-r-none"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-l-none"
                          onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">máx. {product.stock}</span>
                    </div>
                    <Button onClick={handleAddToCart} size="lg" className="w-full gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Añadir al carrito {quantity > 1 ? `(${quantity})` : ''}
                    </Button>
                    <Button
                      onClick={() => {
                        if (product) {
                          addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image_url || '/placeholder.svg',
                            description: product.description || '',
                            category: product.categories?.name || '',
                            stock: product.stock,
                          }, quantity);
                          setQuantity(1);
                          navigate('/checkout');
                        }
                      }}
                      size="lg"
                      variant="secondary"
                      className="w-full gap-2"
                    >
                      <Zap className="h-5 w-5" />
                      Comprar ahora
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Price History */}
          <PriceHistoryChart productId={product.id} />

          {/* Reviews Section */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
                Opiniones
              </h2>
              
              {canReview && !showReviewForm && (
                <Button size="sm" onClick={() => setShowReviewForm(true)}>
                  Escribir reseña
                </Button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Tu opinión</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm
                    productId={product.id}
                    existingReview={userReview}
                    onSuccess={() => setShowReviewForm(false)}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Edit existing review */}
            {hasUserReview && !showReviewForm && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Tu reseña</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={userReview!.rating} size="sm" />
                        {userReview!.comment && (
                          <span className="text-sm text-muted-foreground truncate">
                            "{userReview!.comment}"
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)} className="shrink-0">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Login prompt */}
            {!user && (
              <Card>
                <CardContent className="p-4 md:p-6 text-center">
                  <p className="text-muted-foreground mb-4 text-sm md:text-base">
                    Inicia sesión para dejar tu opinión sobre este producto
                  </p>
                  <Link to="/login">
                    <Button variant="outline" size="sm">Iniciar sesión</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Purchase required prompt */}
            {user && !hasPurchased && !userReview && (
              <Card>
                <CardContent className="p-4 md:p-6 text-center">
                  <p className="text-muted-foreground text-sm md:text-base">
                    Solo los clientes que han comprado este producto pueden dejar una reseña
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <ReviewList
                productId={product.id}
                reviews={reviews}
                onEditReview={() => setShowReviewForm(true)}
                purchasedUserIds={purchasedUserIds}
              />
            )}
          </div>

          {/* Recently Viewed */}
          <RecentlyViewed excludeId={product.id} />

          {/* Related Products */}
          <RelatedProducts 
            currentProductId={product.id} 
            categoryId={product.category_id} 
          />
        </div>
      </main>

      {/* Mobile Sticky Add-to-Cart */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-t p-3">
        <div className="container mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-primary text-lg">{formatPrice(product.price * quantity)}</p>
              <p className="text-xs text-muted-foreground truncate">{product.name}</p>
            </div>
            {product.stock > 0 && (
              <div className="flex items-center border rounded-md shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          {product.stock === 0 ? (
            <Button variant="secondary" disabled className="w-full">
              Agotado
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleAddToCart} className="flex-1 gap-2">
                <ShoppingCart className="h-4 w-4" />
                Añadir
              </Button>
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={() => {
                  addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image_url || '/placeholder.svg',
                    description: product.description || '',
                    category: product.categories?.name || '',
                    stock: product.stock,
                  }, quantity);
                  setQuantity(1);
                  navigate('/checkout');
                }}
              >
                <Zap className="h-4 w-4" />
                Comprar
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default ProductDetail;
