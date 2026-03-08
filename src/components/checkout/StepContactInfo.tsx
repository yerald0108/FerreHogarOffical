import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail } from 'lucide-react';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
}

interface StepContactInfoProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StepContactInfo = ({ formData, onInputChange }: StepContactInfoProps) => {
  return (
    <Card className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Datos de Contacto</h2>
          <p className="text-sm text-muted-foreground">Información para contactarte sobre tu pedido</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Nombre Completo *
          </Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Ej: Juan Pérez García"
            value={formData.fullName}
            onChange={onInputChange}
            className="h-12"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Teléfono *
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+53 5XXX XXXX"
            value={formData.phone}
            onChange={onInputChange}
            className="h-12"
            autoComplete="tel"
            required
          />
          <p className="text-xs text-muted-foreground">Te contactaremos por este número para confirmar</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Correo Electrónico (opcional)
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={onInputChange}
            className="h-12"
            autoComplete="email"
          />
        </div>
      </div>
    </Card>
  );
};
