import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '5352000000';

export function WhatsAppFAB() {
  const location = useLocation();

  // Hide on admin/gestor pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/gestionar')) {
    return null;
  }

  // On product detail pages, push up above the mobile sticky bar
  const isProductDetail = /^\/producto\//.test(location.pathname);

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, necesito ayuda con mi pedido en FerreHogar')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className={`fixed left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 animate-fade-in md:bottom-6 ${
        isProductDetail ? 'bottom-36' : 'bottom-20'
      }`}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
