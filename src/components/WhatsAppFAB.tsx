import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '5352000000';

const ALLOWED_PATHS = new Set([
  '/',
  '/terminos',
  '/devoluciones',
  '/privacidad',
  '/nosotros',
  '/contacto',
]);

export function WhatsAppFAB() {
  const { pathname } = useLocation();

  if (!ALLOWED_PATHS.has(pathname)) {
    return null;
  }

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, necesito ayuda con mi pedido en FerreHogar')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed left-4 bottom-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 animate-fade-in md:bottom-6"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
