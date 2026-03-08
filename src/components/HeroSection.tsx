import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Truck, Shield, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
}

function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('id, title, subtitle, image_url, link_url')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
    staleTime: 60_000,
  });
}

const defaultBanner: Banner = {
  id: 'default',
  title: 'Todo para tu hogar y proyectos',
  subtitle: 'La ferretería más completa de Cuba. Herramientas, materiales de construcción, plomería, electricidad y más.',
  image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=500&fit=crop',
  link_url: '/productos',
};

export function HeroSection() {
  const { data: banners } = useBanners();
  const slides = banners && banners.length > 0 ? banners : [defaultBanner];
  const [current, setCurrent] = useState(0);
  const hasMultiple = slides.length > 1;

  const goNext = useCallback(() => setCurrent(i => (i + 1) % slides.length), [slides.length]);
  const goPrev = useCallback(() => setCurrent(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [hasMultiple, goNext]);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-secondary/90">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
      
      <div className="container mx-auto px-4 py-10 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="text-secondary-foreground space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium">
              <Truck className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Entrega a domicilio en todo Cuba
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {slide.id === 'default' ? (
                <>Todo para tu <span className="text-primary">hogar</span> y{' '}<span className="text-accent">proyectos</span></>
              ) : (
                slide.title
              )}
            </h1>
            
            <p className="text-base md:text-lg text-secondary-foreground/80 max-w-lg">
              {slide.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={slide.link_url || '/productos'} className="flex-1 sm:flex-initial">
                <Button size="lg" className="gap-2 text-base md:text-lg w-full sm:w-auto sm:px-8">
                  Ver Productos
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/registro" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="text-base md:text-lg w-full sm:w-auto sm:px-8 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
                  Crear Cuenta
                </Button>
              </Link>
            </div>

            {/* Dots */}
            {hasMultiple && (
              <div className="flex gap-2 pt-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === current ? 'w-6 bg-primary' : 'w-2 bg-secondary-foreground/30 hover:bg-secondary-foreground/50'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Hero image */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-3"></div>
            <img
              src={slide.image_url}
              alt={slide.title}
              className="relative rounded-3xl shadow-2xl object-cover w-full h-[500px] transition-opacity duration-500"
              loading="lazy"
              decoding="async"
            />
            {/* Nav arrows */}
            {hasMultiple && (
              <>
                <Button variant="secondary" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-70 hover:opacity-100" onClick={goPrev}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-70 hover:opacity-100" onClick={goNext}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Features */}
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 mt-8 md:mt-16 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
          <div className="flex items-center gap-3 md:gap-4 bg-secondary-foreground/5 rounded-xl p-3 md:p-4 min-w-[240px] md:min-w-0 snap-start shrink-0 md:shrink">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary shrink-0">
              <Truck className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground text-sm md:text-base">Entrega a Domicilio</h3>
              <p className="text-xs md:text-sm text-secondary-foreground/70">En todo Cuba</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 bg-secondary-foreground/5 rounded-xl p-3 md:p-4 min-w-[240px] md:min-w-0 snap-start shrink-0 md:shrink">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary shrink-0">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground text-sm md:text-base">Compra Segura</h3>
              <p className="text-xs md:text-sm text-secondary-foreground/70">Múltiples formas de pago</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 bg-secondary-foreground/5 rounded-xl p-3 md:p-4 min-w-[240px] md:min-w-0 snap-start shrink-0 md:shrink">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary shrink-0">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground text-sm md:text-base">Horarios Flexibles</h3>
              <p className="text-xs md:text-sm text-secondary-foreground/70">Tú eliges cuándo recibirlo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
