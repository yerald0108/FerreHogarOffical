import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { Loader2 } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const GestorPanel = () => {
  const { user, loading, isGestor } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isGestor) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Gestionar Productos" description="Panel de gestión de productos para gestores de FerreHogar." />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Gestionar Productos</h1>
            <p className="text-muted-foreground mt-2">
              Agrega y administra tus productos publicados
            </p>
          </div>
          <AdminProducts gestorMode />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GestorPanel;
