import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone } from 'lucide-react';

interface StepPersonalDataProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StepPersonalData = ({ formData, onChange }: StepPersonalDataProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre Completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            name="fullName"
            placeholder="Tu nombre completo"
            value={formData.fullName}
            onChange={onChange}
            className="pl-10"
            autoComplete="name"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={onChange}
            className="pl-10"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+53 5XXX XXXX"
            value={formData.phone}
            onChange={onChange}
            className="pl-10"
            autoComplete="tel"
            required
          />
        </div>
      </div>
    </div>
  );
};
