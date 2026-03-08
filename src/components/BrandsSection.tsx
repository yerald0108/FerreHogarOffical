import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ScrollReveal';

const brands = [
  'Stanley', 'DeWalt', 'Bosch', 'Makita', 'Truper', 'Black+Decker',
];

export function BrandsSection() {
  return (
    <section className="py-10 md:py-14 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <p className="text-center text-sm font-medium text-muted-foreground mb-8">
            Trabajamos con las mejores marcas del mercado
          </p>
        </ScrollReveal>
        <div className="relative">
          <motion.div
            className="flex gap-12 md:gap-16 items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-xl md:text-2xl font-bold text-muted-foreground/40 whitespace-nowrap select-none hover:text-primary/60 transition-colors duration-300"
              >
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
