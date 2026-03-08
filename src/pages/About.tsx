import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Truck, Shield, Users, Clock, MapPin } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: 'Calidad Garantizada',
      description: 'Trabajamos solo con productos de alta calidad para asegurar tu satisfacción.',
    },
    {
      icon: Truck,
      title: 'Entrega a Domicilio',
      description: 'Llevamos tus productos directamente a la puerta de tu casa.',
    },
    {
      icon: Users,
      title: 'Atención Personalizada',
      description: 'Nuestro equipo está listo para asesorarte en cada compra.',
    },
    {
      icon: Clock,
      title: 'Rapidez',
      description: 'Procesamos y entregamos tu pedido en el menor tiempo posible.',
    },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Sobre Nosotros - FerreHogar" description="Conoce más sobre FerreHogar, tu ferretería de confianza con entrega a domicilio en Cuba." />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              Desde 2024
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Sobre <span className="text-primary">FerreHogar</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Somos tu ferretería de confianza, comprometidos con llevar las mejores herramientas 
              y materiales directamente a tu hogar.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">Nuestra Misión</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  En FerreHogar nos dedicamos a facilitar el acceso a productos de ferretería 
                  de calidad para los hogares cubanos. Entendemos las necesidades de nuestros 
                  clientes y trabajamos cada día para ofrecer un servicio excepcional.
                </p>
                <p className="text-muted-foreground">
                  Nuestro compromiso es brindar una experiencia de compra cómoda, segura y 
                  eficiente, con entrega a domicilio para que no tengas que preocuparte por nada.
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <Wrench className="h-24 w-24 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold text-foreground">FerreHogar</p>
                  <p className="text-muted-foreground">Tu ferretería en casa</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Nuestros Valores
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coverage Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <MapPin className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Zona de Cobertura</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Actualmente realizamos entregas a domicilio en todos los municipios de nuestra 
              provincia. Estamos trabajando para expandir nuestra cobertura y llegar a más hogares.
            </p>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
              <Truck className="h-5 w-5" />
              <span className="font-medium">Entrega rápida y segura</span>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default About;