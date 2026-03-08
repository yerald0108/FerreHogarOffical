import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { Search, Tag, Clock, X } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

const SEARCH_HISTORY_KEY = 'ferrehogar-search-history';
const MAX_HISTORY = 5;

function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addToSearchHistory(term: string) {
  const history = getSearchHistory().filter(h => h !== term);
  history.unshift(term);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
    }
  }, [open]);

  const handleSelectProduct = (productId: string, productName: string) => {
    addToSearchHistory(productName);
    onOpenChange(false);
    navigate(`/producto/${productId}`);
  };

  const handleSelectCategory = (categoryId: string, categoryName: string) => {
    addToSearchHistory(categoryName);
    onOpenChange(false);
    navigate(`/productos?categoria=${categoryId}`);
  };

  const handleSelectHistory = (term: string) => {
    onOpenChange(false);
    navigate(`/productos?buscar=${encodeURIComponent(term)}`);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar productos, categorías..." />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No se encontraron resultados</p>
            <p className="text-xs text-muted-foreground mt-1">Intenta con otro término o revisa nuestras categorías</p>
          </div>
        </CommandEmpty>
        
        {history.length > 0 && (
          <CommandGroup heading={
            <div className="flex items-center justify-between">
              <span>Búsquedas recientes</span>
              <button
                onClick={handleClearHistory}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            </div>
          }>
            {history.map((term) => (
              <CommandItem
                key={term}
                value={`history-${term}`}
                onSelect={() => handleSelectHistory(term)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{term}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Categorías">
          {categories?.map((cat) => (
            <CommandItem
              key={cat.id}
              value={`cat-${cat.name}`}
              onSelect={() => handleSelectCategory(cat.id, cat.name)}
            >
              <Tag className="mr-2 h-4 w-4" />
              <CategoryIcon iconName={cat.icon} className="mr-2 h-4 w-4" />
              <span>{cat.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Productos">
          {products?.slice(0, 20).map((product) => (
            <CommandItem
              key={product.id}
              value={`prod-${product.name}`}
              onSelect={() => handleSelectProduct(product.id, product.name)}
              className="flex items-center gap-3"
            >
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="h-10 w-10 rounded-md object-cover border bg-muted shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-primary">
                  ${product.price.toLocaleString()}
                </span>
                {(product as any).compare_at_price && (product as any).compare_at_price > product.price && (
                  <p className="text-[10px] text-muted-foreground line-through">
                    ${(product as any).compare_at_price.toLocaleString()}
                  </p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
