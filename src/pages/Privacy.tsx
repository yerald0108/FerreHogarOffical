import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';
import { Lock } from 'lucide-react';

const Privacy = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="Política de Privacidad - FerreHogar" description="Política de privacidad y protección de datos de FerreHogar." />
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-3xl prose prose-sm md:prose-base dark:prose-invert">
            <div className="flex items-center gap-3 mb-8 not-prose">
              <Lock className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Política de Privacidad</h1>
            </div>

            <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Información que Recopilamos</h2>
            <p>Recopilamos la información que usted proporciona directamente al crear su cuenta y realizar pedidos: nombre completo, número de teléfono, dirección de correo electrónico y dirección de entrega.</p>

            <h2>2. Uso de la Información</h2>
            <p>Utilizamos su información para:</p>
            <ul>
              <li>Procesar y entregar sus pedidos</li>
              <li>Comunicarnos con usted sobre el estado de sus pedidos</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Enviar notificaciones sobre productos y ofertas (con su consentimiento)</li>
            </ul>

            <h2>3. Protección de Datos</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, modificación, divulgación o destrucción.</p>

            <h2>4. Compartir Información</h2>
            <p>No vendemos, alquilamos ni compartimos su información personal con terceros, excepto cuando sea necesario para procesar sus pedidos (servicio de entrega) o cuando la ley lo requiera.</p>

            <h2>5. Cookies y Almacenamiento Local</h2>
            <p>Utilizamos almacenamiento local del navegador para mantener su sesión activa, guardar preferencias de tema y el contenido de su carrito de compras.</p>

            <h2>6. Sus Derechos</h2>
            <p>Usted tiene derecho a acceder, corregir o eliminar su información personal en cualquier momento desde la sección "Mi Perfil" de su cuenta.</p>

            <h2>7. Cambios en esta Política</h2>
            <p>Nos reservamos el derecho de actualizar esta política de privacidad. Los cambios serán publicados en esta página con la fecha de actualización correspondiente.</p>

            <h2>8. Contacto</h2>
            <p>Si tiene preguntas sobre esta política de privacidad, contáctenos a ventas@ferrehogar.cu o por WhatsApp al +53 5200 0000.</p>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Privacy;
