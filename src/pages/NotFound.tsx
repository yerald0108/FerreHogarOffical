import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { useCategories } from '@/hooks/useProducts';
import { CategoryIcon } from '@/components/CategoryIcon';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/SEOHead';

const NotFound = () => {
  const location = useLocation();
  const { data: categories } = useCategories();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Página no encontrada" description="La página que buscas no existe. Explora nuestro catálogo de productos." />
      <Header />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 text-center">
          {/* Animated 404 */}
          <div className="relative inline-block mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <span className="text-[120px] md:text-[180px] font-black text-primary/10 leading-none select-none block">
                404
              </span>
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="bg-card border shadow-lg rounded-2xl px-6 py-4">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ delay: 1, duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
                  className="text-4xl md:text-5xl mb-1"
                >
                  🔧
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground">¡Oops!</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Página no encontrada
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Parece que esta herramienta no está en nuestro inventario. 
              ¡Pero tenemos muchas otras que te van a encantar!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <Link to="/">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Ir al Inicio
              </Button>
            </Link>
            <Link to="/productos">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Ver Productos
              </Button>
            </Link>
          </motion.div>

          {/* Category suggestions */}
          {categories && categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Explora por categoría</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.slice(0, 6).map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.1 }}
                  >
                    <Link to={`/productos?categoria=${cat.id}`}>
                      <Button variant="secondary" size="sm" className="gap-1.5">
                        <CategoryIcon iconName={cat.icon} className="h-3.5 w-3.5" />
                        {cat.name}
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default NotFound;
