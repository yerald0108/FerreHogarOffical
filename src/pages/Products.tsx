import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useIsMobile } from '@/hooks/use-mobile';
import { SEOHead } from '@/components/SEOHead';
import { PageTransition } from '@/components/PageTransition';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useBulkProductRatings } from '@/hooks/useBulkRatings';
import { useAllProductPrices } from '@/hooks/useProductPrices';

const PRODUCTS_PER_PAGE = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('buscar') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [sortBy, setSortBy] = useState('newest');
  const isMobile = useIsMobile();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  
  const selectedCategory = searchParams.get('categoria') || 'all';

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map(p => p.price)) / 100) * 100;
  }, [products]);

  // Initialize price range when products load
  useMemo(() => {
    if (maxPrice > 0 && priceRange[1] === 10000) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let result = products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || 
        product.categories?.name.toLowerCase() === selectedCategory.toLowerCase() ||
        product.category_id === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesStock = !onlyInStock || product.stock > 0;
      return matchesCategory && matchesSearch && matchesPrice && matchesStock;
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        break; // already sorted by created_at desc from DB
    }

    return result;
  }, [selectedCategory, searchTerm, products, priceRange, onlyInStock, sortBy]);

  // Bulk queries for visible products
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const visibleIds = useMemo(() => visibleProducts.map(p => p.id), [visibleProducts]);
  const { data: bulkRatings } = useBulkProductRatings(visibleIds);
  const { data: bulkPrices } = useAllProductPrices(visibleIds);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', categoryId);
    }
    setSearchParams(searchParams);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPriceRange([0, maxPrice]);
    setOnlyInStock(false);
    setVisibleCount(PRODUCTS_PER_PAGE);
    handleCategoryChange('all');
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || onlyInStock || 
    priceRange[0] > 0 || priceRange[1] < maxPrice;

  const activeFilterCount = [
    searchTerm,
    selectedCategory !== 'all',
    onlyInStock,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  const isLoading = productsLoading || categoriesLoading;

  const filtersContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Availability Filter */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-center justify-between">
          <Label htmlFor="stock-filter" className="text-sm font-medium cursor-pointer">
            Solo productos disponibles
          </Label>
          <Switch
            id="stock-filter"
            checked={onlyInStock}
            onCheckedChange={setOnlyInStock}
          />
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 pb-6 border-b">
        <h3 className="text-sm font-medium text-foreground mb-4">Rango de precio</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={maxPrice}
            step={10}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Categorías</h3>
        <div className="space-y-1">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => handleCategoryChange('all')}
          >
            Todas las categorías
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id || selectedCategory.toLowerCase() === category.name.toLowerCase() ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => handleCategoryChange(category.id)}
            >
              <CategoryIcon iconName={category.icon} className="h-4 w-4" />
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Productos" description="Explora nuestro catálogo completo de herramientas, materiales y artículos para el hogar." />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Productos' }]} />
          <div className="flex flex-col md:flex-row gap-8">
            {/* Mobile: Sheet trigger */}
            {isMobile && (
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 mb-2">
                    <Filter className="h-4 w-4" />
                    Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {filtersContent}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Desktop: Sidebar */}
            {!isMobile && (
              <aside className="w-72 shrink-0">
                <div className="bg-card rounded-xl p-6 shadow-sm border sticky top-24">
                  {filtersContent}
                </div>
              </aside>
            )}
            
            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    {selectedCategory === 'all' 
                      ? 'Todos los Productos' 
                      : categories?.find(c => c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase())?.name || 'Productos'}
                  </h1>
                  <p className="text-muted-foreground">
                    {filteredProducts.length} productos encontrados
                  </p>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] shrink-0">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="name-asc">Nombre: A-Z</SelectItem>
                    <SelectItem value="name-desc">Nombre: Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Tags */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      Búsqueda: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} className="hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {onlyInStock && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      Solo disponibles
                      <button onClick={() => setOnlyInStock(false)} className="hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      ${priceRange[0]} - ${priceRange[1]}
                      <button onClick={() => setPriceRange([0, maxPrice])} className="hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      {categories?.find(c => c.id === selectedCategory)?.name}
                      <button onClick={() => handleCategoryChange('all')} className="hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
              
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  <ProductGridSkeleton count={6} />
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {visibleProducts.map((product, index) => (
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
                {visibleCount < filteredProducts.length && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                      className="gap-2"
                    >
                      Cargar más productos ({filteredProducts.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-2">
                    No se encontraron productos con esos criterios.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Prueba buscando en otra categoría o ajusta los filtros.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 mb-8"
                    onClick={clearAllFilters}
                  >
                    Limpiar filtros
                  </Button>
                  
                  {/* Category suggestions */}
                  {categories && categories.length > 0 && (
                    <div className="border-t pt-8">
                      <h3 className="text-sm font-medium text-foreground mb-4">Explora por categoría</h3>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              clearAllFilters();
                              handleCategoryChange(cat.id);
                            }}
                            className="gap-1"
                          >
                            <CategoryIcon iconName={cat.icon} className="h-3.5 w-3.5" /> {cat.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Products;
