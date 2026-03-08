import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Clock, CheckCircle2, XCircle, Phone, Mail } from 'lucide-react';

const Returns = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="Política de Devoluciones" description="Conoce nuestra política de devoluciones y cambios en FerreHogar." />
        <Header />

        <main className="flex-1 py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Política de Devoluciones</h1>
              <p className="text-muted-foreground mt-2">Tu satisfacción es nuestra prioridad</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Plazo de Devolución
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Tienes <strong className="text-foreground">7 días naturales</strong> desde la recepción del producto para solicitar una devolución o cambio.</p>
                  <p>El producto debe estar en su empaque original, sin uso y en las mismas condiciones en que fue recibido.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Casos Aceptados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      Producto recibido con defectos de fábrica
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      Producto diferente al pedido original
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      Producto dañado durante el transporte
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      Cantidad incorrecta en la entrega
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <XCircle className="h-5 w-5 text-destructive" />
                    Casos No Aceptados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      Productos usados o alterados después de la entrega
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      Productos sin empaque original
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      Solicitudes fuera del plazo de 7 días
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      Materiales cortados a medida (bajo pedido)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    Proceso de Devolución
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <ol className="space-y-3 list-decimal list-inside">
                    <li><strong className="text-foreground">Contacta con nosotros</strong> por WhatsApp o teléfono dentro de los 7 días.</li>
                    <li><strong className="text-foreground">Describe el motivo</strong> de la devolución y adjunta fotos si el producto está dañado.</li>
                    <li><strong className="text-foreground">Coordinamos la recogida</strong> del producto en tu dirección.</li>
                    <li><strong className="text-foreground">Realizamos el reembolso</strong> o cambio en un plazo de 3-5 días hábiles.</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-3">¿Necesitas hacer una devolución?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href="tel:+5352000000" className="hover:text-primary transition-colors">+53 5200 0000</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href="mailto:soporte@ferrehogar.cu" className="hover:text-primary transition-colors">soporte@ferrehogar.cu</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Returns;
