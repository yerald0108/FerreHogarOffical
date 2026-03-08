import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsModal = ({ open, onOpenChange }: TermsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Términos de Uso</DialogTitle>
          <DialogDescription>
            Última actualización: Marzo 2026
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h3 className="font-semibold text-foreground mb-1">1. Aceptación de los Términos</h3>
              <p>Al registrarse y utilizar FerreHogar, usted acepta cumplir con estos términos de uso. Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestros servicios.</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-1">2. Uso del Servicio</h3>
              <p>FerreHogar es una plataforma de comercio electrónico dedicada a la venta de productos de ferretería y hogar en toda Cuba. Los usuarios deben proporcionar información veraz y actualizada al registrarse.</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-1">3. Cuenta de Usuario</h3>
              <p>Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta.</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-1">4. Pedidos y Entregas</h3>
              <p>Los pedidos están sujetos a disponibilidad de stock. Los tiempos de entrega pueden variar según la ubicación. Nos reservamos el derecho de cancelar pedidos en caso de errores en precios o disponibilidad.</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-1">5. Precios y Pagos</h3>
              <p>Los precios están sujetos a cambios sin previo aviso. Los métodos de pago aceptados serán los indicados en la plataforma al momento de la compra.</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-1">6. Privacidad</h3>
              <p>Nos comprometemos a proteger su información personal. Los datos recopilados se utilizarán únicamente para procesar pedidos y mejorar nuestros servicios.</p>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-1">7. Modificaciones</h3>
              <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos desde su publicación en la plataforma.</p>
            </section>
          </div>
        </ScrollArea>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
};
