import { useState, useMemo } from 'react';
import { icons } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Iconos relevantes para categorías de ferretería/tienda de herramientas
const SUGGESTED_ICONS = [
  // Herramientas manuales
  'Wrench', 'Hammer', 'Scissors', 'Ruler', 'PenTool',
  // Herramientas eléctricas y energía
  'Drill', 'Zap', 'PlugZap', 'Cable', 'Power',
  // Construcción y hogar
  'Home', 'Building2', 'Fence', 'DoorOpen', 'Warehouse',
  // Pintura y acabados
  'Paintbrush', 'PaintBucket', 'Palette', 'Pipette', 'Brush',
  // Iluminación
  'Lamp', 'LampDesk', 'Lightbulb', 'Sun', 'Flashlight',
  // Plomería y agua
  'Droplets', 'ShowerHead', 'Bath', 'Waves', 'GlassWater',
  // Seguridad y cerrajería
  'Lock', 'Key', 'Shield', 'ShieldCheck', 'KeyRound',
  // Medición y precisión
  'Gauge', 'Thermometer', 'Scale', 'ScanLine', 'Compass',
  // Fijación y sujeción
  'Link', 'Paperclip', 'CircleDot', 'Target', 'Anchor',
  // Jardín y exteriores
  'Leaf', 'TreePine', 'Flower2', 'Sprout', 'CloudRain',
  // Materiales y almacenamiento
  'Box', 'Package', 'Boxes', 'Container', 'Archive',
  // Limpieza y mantenimiento
  'SprayCan', 'Trash2', 'Recycle', 'Wind', 'Flame',
  // Vehículos y automotriz
  'Car', 'Truck', 'Cog', 'Settings', 'RotateCw',
  // General tienda
  'ShoppingCart', 'Store', 'Tag', 'Star', 'Sparkles',
];

// Convert PascalCase to kebab-case for storage
function toKebab(name: string) {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return SUGGESTED_ICONS;
    const q = search.toLowerCase();
    // Search through all lucide icons
    const allNames = Object.keys(icons);
    return allNames.filter(name => name.toLowerCase().includes(q)).slice(0, 60);
  }, [search]);

  const handleSelect = (iconName: string) => {
    onChange(toKebab(iconName));
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-10 font-normal"
          type="button"
        >
          <CategoryIcon iconName={value || null} className="h-4 w-4 text-primary" />
          <span className={cn(!value && 'text-muted-foreground')}>
            {value || 'Seleccionar icono...'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar icono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="h-56">
          <div className="grid grid-cols-6 gap-1 p-3">
            {filteredIcons.map((name) => {
              const kebab = toKebab(name);
              const isSelected = value === kebab;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  title={kebab}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-md transition-colors hover:bg-accent',
                    isSelected && 'bg-primary/10 ring-1 ring-primary'
                  )}
                >
                  <CategoryIcon iconName={kebab} className="h-4.5 w-4.5" />
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <p className="col-span-6 text-center text-sm text-muted-foreground py-6">
                No se encontraron iconos
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
