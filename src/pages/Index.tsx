import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { ArrowRight } from 'lucide-react';
import { CategoryGridSkeleton } from '@/components/skeletons/CategoryCardSkeleton';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { SEOHead } from '@/components/SEOHead';
import { PageTransition } from '@/components/PageTransition';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';
import { Testimonials } from '@/components/Testimonials';
import { DealsSection } from '@/components/DealsSection';
import { StatsSection } from '@/components/StatsSection';
import { BrandsSection } from '@/components/BrandsSection';
import { ScrollReveal } from '@/components/ScrollReveal';

const Index = () => {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  
  const featuredProducts = products?.slice(0, 4) || [];
  const featuredIds = featuredProducts.map(p => p.id);
  const { data: bulkRatings } = useBulkProductRatings(featuredIds);
  const { data: bulkPrices } = useAllProductPrices(featuredIds);
  
  const getCategoryProductCount = (categoryId: string) => {
    return products?.filter(p => p.category_id === categoryId).length || 0;
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead />
      <Header />
      
      <main id="main-content" className="flex-1">
        <HeroSection />
        
        {/* Categories Section */}
        <section className="py-8 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center mb-6 md:mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nuestras Categorías</h2>
                <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                  Encuentra todo lo que necesitas para tus proyectos
                </p>
              </div>
            </ScrollReveal>
            
            {categoriesLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                <CategoryGridSkeleton count={6} />
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {categories?.map((category, i) => (
                  <ScrollReveal key={category.id} delay={i * 0.05}>
                    <CategoryCard
                      id={category.id}
                      name={category.name}
                      icon={category.icon || 'package'}
                      productCount={getCategoryProductCount(category.id)}
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="py-8 md:py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6 md:mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Productos Destacados</h2>
                  <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                    Los más vendidos de nuestra tienda
                  </p>
                </div>
                <Link to="/productos">
                  <Button variant="outline" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm">
                    <span className="hidden sm:inline">Ver Todos</span>
                    <span className="sm:hidden">Ver</span>
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
            
            {productsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <ProductGridSkeleton count={4} />
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {featuredProducts.map((product, index) => (
                  <ProductCard 
                    key={product.id}
                    index={index}
                    bulkMode
                    bulkRating={bulkRatings?.get(product.id)}
                    bulkPrices={bulkPrices?.get(product.id)}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image_url || '/placeholder.svg',
                      category: product.categories?.name || '',
                      description: product.description || '',
                      stock: product.stock,
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No hay productos disponibles aún. ¡Pronto agregaremos más!
              </div>
            )}
          </div>
        </section>
        
        {/* Deals Section */}
        <DealsSection />

        {/* Stats */}
        <StatsSection />

        {/* Brands */}
        <BrandsSection />

        {/* Testimonials */}
        <Testimonials />

        {/* CTA Section */}
        <ScrollReveal>
          <section className="py-12 md:py-20 bg-primary">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-3 md:mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-primary-foreground/80 text-sm md:text-lg max-w-2xl mx-auto mb-6 md:mb-8">
                Regístrate ahora y recibe tus herramientas directamente en tu puerta. 
                Sin filas, sin esperas.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                <Link to="/registro">
                  <Button size="lg" variant="secondary" className="text-base md:text-lg w-full sm:w-auto sm:px-8">
                    Crear Mi Cuenta
                  </Button>
                </Link>
                <Link to="/productos">
                  <Button size="lg" variant="outline" className="text-base md:text-lg w-full sm:w-auto sm:px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Explorar Catálogo
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Index;
