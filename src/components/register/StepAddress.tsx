import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { getProvinceNames, getMunicipalitiesByProvince } from '@/data/cuba-locations';

interface StepAddressProps {
  formData: {
    province: string;
    municipality: string;
    address: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const StepAddress = ({ formData, onChange, onSelectChange }: StepAddressProps) => {
  const provinces = getProvinceNames();
  const municipalities = formData.province ? getMunicipalitiesByProvince(formData.province) : [];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Provincia</Label>
        <Select
          value={formData.province}
          onValueChange={(value) => {
            onSelectChange('province', value);
            onSelectChange('municipality', '');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu provincia" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Municipio</Label>
        <Select
          value={formData.municipality}
          onValueChange={(value) => onSelectChange('municipality', value)}
          disabled={!formData.province}
        >
          <SelectTrigger>
            <SelectValue placeholder={formData.province ? 'Selecciona tu municipio' : 'Primero selecciona una provincia'} />
          </SelectTrigger>
          <SelectContent>
            {municipalities.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección Exacta</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            name="address"
            placeholder="Calle, número, entre calles..."
            value={formData.address}
            onChange={onChange}
            className="pl-10"
            autoComplete="street-address"
          />
        </div>
      </div>
    </div>
  );
};
