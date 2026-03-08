import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';
import { Shield } from 'lucide-react';

const Terms = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="Términos y Condiciones - FerreHogar" description="Términos y condiciones de uso de FerreHogar." />
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-3xl prose prose-sm md:prose-base dark:prose-invert">
            <div className="flex items-center gap-3 mb-8 not-prose">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Términos y Condiciones</h1>
            </div>

            <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar FerreHogar, usted acepta estos términos y condiciones en su totalidad. Si no está de acuerdo con alguno de estos términos, no utilice nuestro servicio.</p>

            <h2>2. Uso del Servicio</h2>
            <p>FerreHogar es una plataforma de comercio electrónico para la venta de productos de ferretería y hogar. Para realizar compras, debe crear una cuenta con información veraz y actualizada.</p>

            <h2>3. Productos y Precios</h2>
            <p>Los precios mostrados incluyen todos los impuestos aplicables. Nos reservamos el derecho de modificar precios sin previo aviso. Los precios vigentes son los publicados al momento de su compra.</p>

            <h2>4. Pedidos y Pagos</h2>
            <p>Al realizar un pedido, usted se compromete a completar la transacción. Aceptamos múltiples métodos de pago incluyendo efectivo, transfermóvil y tarjeta. La confirmación del pedido está sujeta a disponibilidad de stock.</p>

            <h2>5. Entregas</h2>
            <p>Las entregas se realizan en los horarios seleccionados por el cliente. Los tiempos de entrega son estimados y pueden variar según la ubicación y disponibilidad. FerreHogar no se responsabiliza por retrasos causados por circunstancias fuera de nuestro control.</p>

            <h2>6. Devoluciones</h2>
            <p>Se aceptan devoluciones dentro de los 7 días posteriores a la entrega, siempre que el producto esté en su empaque original y sin uso. Los productos defectuosos serán reemplazados sin costo adicional.</p>

            <h2>7. Propiedad Intelectual</h2>
            <p>Todo el contenido de FerreHogar, incluyendo textos, imágenes, logos y diseño, es propiedad de FerreHogar y está protegido por las leyes de propiedad intelectual.</p>

            <h2>8. Limitación de Responsabilidad</h2>
            <p>FerreHogar no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de nuestros productos o servicios.</p>

            <h2>9. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos, contáctenos a través de ventas@ferrehogar.cu o por WhatsApp al +53 5200 0000.</p>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Terms;
