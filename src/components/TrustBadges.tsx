import { Shield, Truck, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';

export function TrustBadges() {
  return (
    <div className="space-y-3 mt-4 p-4 bg-muted/50 rounded-lg border">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Compra con confianza
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span>Pago seguro con múltiples métodos</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>Entrega a domicilio en las 16 provincias</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 text-orange-600 shrink-0" />
          <span>Garantía de devolución en 7 días</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
          <span>Atención al cliente de lunes a sábado</span>
        </div>
      </div>
    </div>
  );
}
