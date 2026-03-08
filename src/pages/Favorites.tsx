import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';
import { useMemo, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading } = useFavorites();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get existing share link
  const { data: existingShare } = useQuery({
    queryKey: ['my-share-link', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shared_wishlists')
        .select('share_code')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleShareWishlist = async () => {
    if (!user) return;
    setSharing(true);
    try {
      let shareCode = existingShare?.share_code;
      if (!shareCode) {
        const { data, error } = await supabase
          .from('shared_wishlists')
          .insert({ user_id: user.id })
          .select('share_code')
          .single();
        if (error) throw error;
        shareCode = data.share_code;
      }
      const url = `${window.location.origin}/wishlist/${shareCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      toast.error('Error al generar el enlace');
    } finally {
      setSharing(false);
    }
  };

  const favoriteProducts = useMemo(() => {
    return favorites
      .filter((fav) => fav.products && fav.products.is_active)
      .map((fav) => ({
        id: fav.products!.id,
        name: fav.products!.name,
        price: fav.products!.price,
        image: fav.products!.image_url || '/placeholder.svg',
        stock: fav.products!.stock,
        description: fav.products!.description || '',
        category: fav.products!.categories?.name || 'Sin categoría',
      }));
  }, [favorites]);

  const favIds = useMemo(() => favoriteProducts.map(p => p.id), [favoriteProducts]);
  const { data: bulkRatings } = useBulkProductRatings(favIds);
  const { data: bulkPrices } = useAllProductPrices(favIds);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductGridSkeleton count={4} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Mis Favoritos" description="Tu lista de productos favoritos en FerreHogar." />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-destructive" />
          <h1 className="text-3xl font-bold text-foreground">Mis Favoritos</h1>
          {favoriteProducts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-2"
              onClick={handleShareWishlist}
              disabled={sharing}
            >
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copied ? 'Copiado' : 'Compartir'}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductGridSkeleton count={4} />
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No tienes productos favoritos
            </h2>
            <p className="text-muted-foreground mb-6">
              Explora nuestro catálogo y guarda los productos que te interesen
            </p>
            <Button asChild>
              <Link to="/productos">Ver productos</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {favoriteProducts.length} {favoriteProducts.length === 1 ? 'producto' : 'productos'} en tu lista
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteProducts.map((product, index) => (
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
