import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Truck, CreditCard, RotateCcw, ShieldCheck, Clock, Package } from 'lucide-react';

const faqSections = [
  {
    title: 'Envíos y Entregas',
    icon: Truck,
    items: [
      {
        q: '¿Cuánto tarda la entrega?',
        a: 'Las entregas se realizan generalmente entre 24 y 72 horas después de confirmar tu pedido, dependiendo de tu ubicación y la disponibilidad del producto.',
      },
      {
        q: '¿Tienen costo de envío?',
        a: 'El costo de envío varía según tu ubicación y el tamaño del pedido. Te informaremos el costo exacto antes de confirmar tu compra.',
      },
      {
        q: '¿Entregan en toda Cuba?',
        a: 'Actualmente realizamos entregas en La Habana y estamos expandiendo nuestra cobertura a otras provincias. Consulta disponibilidad para tu zona.',
      },
      {
        q: '¿Puedo elegir el horario de entrega?',
        a: 'Sí, durante el proceso de compra puedes seleccionar entre mañana (8:00-12:00), tarde (2:00-6:00) o noche (6:00-9:00).',
      },
    ],
  },
  {
    title: 'Pagos',
    icon: CreditCard,
    items: [
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Aceptamos efectivo (CUP), transfermóvil, tarjeta (MLC), Zelle, USD y EUR. Los métodos disponibles pueden variar según el producto.',
      },
      {
        q: '¿Se paga al recibir el producto?',
        a: 'Sí, para pagos en efectivo se realiza al momento de la entrega. Para transferencias, te contactaremos para coordinar el pago antes del envío.',
      },
      {
        q: '¿Los precios incluyen impuestos?',
        a: 'Sí, todos los precios mostrados en la tienda son precios finales.',
      },
    ],
  },
  {
    title: 'Devoluciones y Garantías',
    icon: RotateCcw,
    items: [
      {
        q: '¿Puedo devolver un producto?',
        a: 'Sí, aceptamos devoluciones dentro de los 7 días posteriores a la entrega siempre que el producto esté en su empaque original y sin uso.',
      },
      {
        q: '¿Qué hago si recibo un producto defectuoso?',
        a: 'Contáctanos inmediatamente por WhatsApp o teléfono. Realizaremos el cambio sin costo adicional.',
      },
      {
        q: '¿Las herramientas tienen garantía?',
        a: 'Sí, todas las herramientas cuentan con garantía del fabricante. La duración varía según el producto y la marca.',
      },
    ],
  },
  {
    title: 'Pedidos y Cuenta',
    icon: Package,
    items: [
      {
        q: '¿Necesito una cuenta para comprar?',
        a: 'Sí, necesitas crear una cuenta gratuita para realizar pedidos. Esto nos permite darte seguimiento a tus compras y ofrecerte una mejor experiencia.',
      },
      {
        q: '¿Puedo cancelar un pedido?',
        a: 'Sí, puedes cancelar pedidos que estén en estado "Pendiente" desde la sección "Mis Pedidos". Una vez confirmado, contacta con nosotros.',
      },
      {
        q: '¿Cómo hago seguimiento de mi pedido?',
        a: 'En la sección "Mis Pedidos" puedes ver el estado actualizado de todos tus pedidos con una línea de tiempo detallada.',
      },
    ],
  },
];

const FAQ = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead
          title="Preguntas Frecuentes - FerreHogar"
          description="Resuelve tus dudas sobre envíos, pagos, devoluciones y más en FerreHogar."
        />
        <Header />

        <main className="flex-1">
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
            <div className="container mx-auto px-4 text-center">
              <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Preguntas Frecuentes
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Encuentra respuestas rápidas a las preguntas más comunes sobre nuestros servicios.
              </p>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="space-y-8">
                {faqSections.map((section, sIdx) => (
                  <div key={sIdx}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                    </div>
                    <Accordion type="single" collapsible className="space-y-2">
                      {section.items.map((item, iIdx) => (
                        <AccordionItem
                          key={iIdx}
                          value={`${sIdx}-${iIdx}`}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-left text-sm md:text-base font-medium hover:no-underline">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center p-6 bg-muted/50 rounded-xl">
                <p className="text-muted-foreground mb-3">
                  ¿No encuentras lo que buscas?
                </p>
                <a
                  href="https://wa.me/5352000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  Escríbenos por WhatsApp
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default FAQ;
