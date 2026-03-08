import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'FerreHogar',
  description: 'Ferretería online con entrega a domicilio en Cuba. Herramientas, materiales de construcción y artículos para el hogar.',
  telephone: '+53 5200 0000',
  email: 'contacto@ferrehogar.cu',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'La Habana',
    addressCountry: 'CU',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '09:00',
      closes: '13:00',
    },
  ],
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Rate limit: 60 seconds between submissions
    const now = Date.now();
    if (now - lastSubmitTime < 60000) {
      toast.error('Por favor espera un momento antes de enviar otro mensaje.');
      return;
    }

    // Input validation
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();
    const phone = formData.phone.trim();

    if (name.length < 2 || name.length > 100) {
      toast.error('El nombre debe tener entre 2 y 100 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      toast.error('Ingresa un correo electrónico válido.');
      return;
    }
    if (subject.length < 3 || subject.length > 200) {
      toast.error('El asunto debe tener entre 3 y 200 caracteres.');
      return;
    }
    if (message.length < 10 || message.length > 2000) {
      toast.error('El mensaje debe tener entre 10 y 2000 caracteres.');
      return;
    }
    if (phone && (phone.length < 6 || phone.length > 20)) {
      toast.error('Ingresa un teléfono válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
      });

      if (error) throw error;

      setSubmitted(true);
      setLastSubmitTime(Date.now());
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Mensaje enviado correctamente');
    } catch (err: any) {
      toast.error('Error al enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Teléfono',
      details: ['+53 5200 0000'],
    },
    {
      icon: Mail,
      title: 'Correo Electrónico',
      details: ['contacto@ferrehogar.cu', 'ventas@ferrehogar.cu'],
    },
    {
      icon: MapPin,
      title: 'Ubicación',
      details: ['La Habana, Cuba', 'Servicio a domicilio'],
    },
    {
      icon: Clock,
      title: 'Horario de Atención',
      details: ['Lunes a Sábado: 8:00 AM - 6:00 PM', 'Domingo: 9:00 AM - 1:00 PM'],
    },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Contacto — Escríbenos"
        description="Contáctanos por formulario, correo o WhatsApp. Atención personalizada para tus pedidos de ferretería y hogar en Cuba."
        url="https://ferrehogar.cu/contacto"
        jsonLd={contactJsonLd}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Contáctanos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para asistirte. 
              Escríbenos y te responderemos lo antes posible.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-primary" />
                      Envíanos un mensaje
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submitted ? (
                      <div className="text-center py-12 space-y-4 animate-fade-in">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">¡Mensaje enviado!</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Hemos recibido tu mensaje. Te responderemos lo antes posible a tu correo electrónico.
                        </p>
                        <Button variant="outline" onClick={() => setSubmitted(false)}>
                          Enviar otro mensaje
                        </Button>
                      </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre completo *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                            required
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Correo electrónico *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            required
                            maxLength={255}
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+53 5XXX XXXX"
                            maxLength={20}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Asunto *</Label>
                          <Input
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="¿En qué podemos ayudarte?"
                            required
                            maxLength={200}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mensaje *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Escribe tu mensaje aquí..."
                          rows={5}
                          required
                          maxLength={2000}
                        />
                      </div>

                      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                          'Enviando...'
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Enviar mensaje
                          </>
                        )}
                      </Button>
                    </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <info.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                          {info.details.map((detail, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* WhatsApp CTA */}
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
                  <CardContent className="p-5 text-center">
                    <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <Phone className="h-7 w-7 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">¿Prefieres WhatsApp?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Escríbenos directamente por WhatsApp para una respuesta más rápida.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-500 text-green-600 hover:bg-green-500/10"
                      onClick={() => window.open('https://wa.me/5352000000', '_blank')}
                    >
                      Abrir WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Contact;
