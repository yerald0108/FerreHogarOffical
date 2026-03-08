import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { SEOHead } from '@/components/SEOHead';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';
import { useMemo } from 'react';

export default function SharedWishlist() {
  const { code } = useParams<{ code: string }>();

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['shared-wishlist', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_wishlists')
        .select('*')
        .eq('share_code', code!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  const { data: favorites = [], isLoading: favsLoading } = useQuery({
    queryKey: ['shared-favorites', wishlist?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, products(*, categories(*))')
        .eq('user_id', wishlist!.user_id);
      if (error) throw error;
      return data;
    },
    enabled: !!wishlist?.user_id,
  });

  const products = useMemo(() => {
    return favorites
      .filter((fav: any) => fav.products && fav.products.is_active)
      .map((fav: any) => ({
        id: fav.products.id,
        name: fav.products.name,
        price: fav.products.price,
        image: fav.products.image_url || '/placeholder.svg',
        stock: fav.products.stock,
        description: fav.products.description || '',
        category: fav.products.categories?.name || 'Sin categoría',
      }));
  }, [favorites]);

  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: bulkRatings } = useBulkProductRatings(productIds);
  const { data: bulkPrices } = useAllProductPrices(productIds);

  const isLoading = wishlistLoading || favsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Lista de Deseos Compartida" description="Mira esta lista de productos favoritos en FerreHogar." />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold text-foreground">Lista de Deseos Compartida</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductGridSkeleton count={4} />
          </div>
        ) : !wishlist ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Lista no encontrada</h2>
            <p className="text-muted-foreground mb-6">Este enlace puede haber expirado o no existe.</p>
            <Button asChild>
              <Link to="/productos">Ver productos</Link>
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Esta lista está vacía</h2>
            <p className="text-muted-foreground mb-6">No hay productos en esta lista de deseos.</p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {products.length} {products.length === 1 ? 'producto' : 'productos'} en esta lista
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  bulkMode
                  bulkRating={bulkRatings?.get(product.id)}
                  bulkPrices={bulkPrices?.get(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
