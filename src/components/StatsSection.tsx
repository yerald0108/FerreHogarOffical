import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Users, ShoppingBag, Star, Truck } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}+</span>;
}

const stats = [
  { icon: Users, label: 'Clientes Satisfechos', value: 500 },
  { icon: ShoppingBag, label: 'Productos Vendidos', value: 1200 },
  { icon: Star, label: 'Reseñas Positivas', value: 350 },
  { icon: Truck, label: 'Entregas Realizadas', value: 800 },
];

export function StatsSection() {
  return (
    <section className="py-12 md:py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1} className="text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  <AnimatedCounter target={stat.value} />
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
