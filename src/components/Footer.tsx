import { forwardRef } from 'react';
import { Wrench, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return (
    <footer ref={ref} className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base">FerreHogar</h3>
                <p className="text-[10px] md:text-xs text-secondary-foreground/70">Tu ferretería en casa</p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-secondary-foreground/70">
              La mejor selección de herramientas y materiales con entrega a domicilio.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Enlaces</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-secondary-foreground/70">
              <li><Link to="/" className="hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link to="/productos" className="hover:text-primary transition-colors">Productos</Link></li>
              <li><Link to="/nosotros" className="hover:text-primary transition-colors">Nosotros</Link></li>
              <li><Link to="/contacto" className="hover:text-primary transition-colors">Contacto</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link to="/devoluciones" className="hover:text-primary transition-colors">Devoluciones</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="hidden md:block">
            <h4 className="font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/productos?categoria=herramientas" className="hover:text-primary transition-colors">Herramientas</Link></li>
              <li><Link to="/productos?categoria=electricidad" className="hover:text-primary transition-colors">Electricidad</Link></li>
              <li><Link to="/productos?categoria=plomeria" className="hover:text-primary transition-colors">Plomería</Link></li>
              <li><Link to="/productos?categoria=pintura" className="hover:text-primary transition-colors">Pintura</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Contacto</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-secondary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                <a href="tel:+5352000000" className="hover:text-primary transition-colors">+53 5200 0000</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                <a href="mailto:ventas@ferrehogar.cu" className="hover:text-primary transition-colors truncate">ventas@ferrehogar.cu</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary mt-0.5 shrink-0" />
                <span>La Habana, Cuba</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-3">
              <a href="https://wa.me/5352000000" target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/50 hover:text-primary transition-colors" aria-label="WhatsApp">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-foreground/50 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-foreground/50 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-6 md:mt-8 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-secondary-foreground/50">
          <p>© {new Date().getFullYear()} FerreHogar. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link to="/terminos" className="hover:text-primary transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link to="/devoluciones" className="hover:text-primary transition-colors">Devoluciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});
