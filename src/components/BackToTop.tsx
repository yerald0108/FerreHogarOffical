import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  // On product detail pages, push up above the mobile sticky bar
  const isProductDetail = /^\/producto\//.test(location.pathname);

  return (
    <Button
      size="icon"
      className={cn(
        'fixed right-4 z-50 rounded-full shadow-lg md:bottom-6',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
        isProductDetail ? 'bottom-36' : 'bottom-20'
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
