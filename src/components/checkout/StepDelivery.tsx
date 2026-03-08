import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Truck } from 'lucide-react';
import { getProvinceNames, getMunicipalitiesByProvince } from '@/data/cuba-locations';

interface FormData {
  address: string;
  province: string;
  municipality: string;
  deliveryTime: string;
  notes: string;
}

interface StepDeliveryProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSelectChange: (field: string, value: string) => void;
}

const deliveryTimes = [
  { value: 'manana', label: 'Mañana', time: '8:00 AM - 12:00 PM', icon: '🌅' },
  { value: 'tarde', label: 'Tarde', time: '2:00 PM - 6:00 PM', icon: '☀️' },
  { value: 'noche', label: 'Noche', time: '6:00 PM - 9:00 PM', icon: '🌙' },
];

export const StepDelivery = ({ formData, onInputChange, onSelectChange }: StepDeliveryProps) => {
  const provinceNames = getProvinceNames();
  const municipalities = formData.province ? getMunicipalitiesByProvince(formData.province) : [];

  const handleProvinceChange = (value: string) => {
    onSelectChange('province', value);
    onSelectChange('municipality', '');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Address Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dirección de Entrega</h2>
            <p className="text-sm text-muted-foreground">¿Dónde entregamos tu pedido?</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province">Provincia *</Label>
              <Select
                value={formData.province}
                onValueChange={handleProvinceChange}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecciona tu provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provinceNames.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality">Municipio *</Label>
              <Select
                value={formData.municipality}
                onValueChange={(value) => onSelectChange('municipality', value)}
                disabled={!formData.province}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={formData.province ? 'Selecciona tu municipio' : 'Selecciona provincia primero'} />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((mun) => (
                    <SelectItem key={mun} value={mun}>
                      {mun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa *</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Calle, número, entre calles, edificio, apartamento, referencias..."
              value={formData.address}
              onChange={onInputChange}
              rows={3}
              className="resize-none"
              autoComplete="street-address"
              required
            />
            <p className="text-xs text-muted-foreground">
              Incluye referencias para facilitar la entrega
            </p>
          </div>
        </div>
      </Card>

      {/* Delivery Time Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Horario de Entrega</h2>
            <p className="text-sm text-muted-foreground">¿Cuándo te viene mejor recibir el pedido?</p>
          </div>
        </div>

        <RadioGroup
          value={formData.deliveryTime}
          onValueChange={(value) => onSelectChange('deliveryTime', value)}
          className="grid gap-3"
        >
          {deliveryTimes.map((time) => (
            <div
              key={time.value}
              className={`flex items-center space-x-4 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                formData.deliveryTime === time.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value={time.value} id={time.value} className="sr-only" />
              <span className="text-2xl">{time.icon}</span>
              <Label htmlFor={time.value} className="cursor-pointer flex-1">
                <span className="font-semibold text-foreground">{time.label}</span>
                <span className="block text-sm text-muted-foreground">{time.time}</span>
              </Label>
              <div
                className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                  formData.deliveryTime === time.value
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {formData.deliveryTime === time.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>
          ))}
        </RadioGroup>
      </Card>

      {/* Notes Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <Truck className="h-5 w-5 text-muted-foreground" />
          </div>
          <Label htmlFor="notes" className="text-base font-medium">
            Notas adicionales (opcional)
          </Label>
        </div>
        <Textarea
          id="notes"
          name="notes"
          placeholder="¿Alguna instrucción especial para la entrega? Ej: Tocar timbre del apto 3..."
          value={formData.notes}
          onChange={onInputChange}
          rows={2}
          className="resize-none"
        />
      </Card>
    </div>
  );
};
