import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StockAlertFormProps {
  productId: string;
  productName: string;
}

export function StockAlertForm({ productId, productName }: StockAlertFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      toast.error('Ingresa un email o teléfono para notificarte');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('stock_alerts').insert({
        product_id: productId,
        email: email || null,
        phone: phone || null,
        user_id: user?.id || null,
      } as any);

      if (error) throw error;
      toast.success('¡Te notificaremos cuando esté disponible!');
      setOpen(false);
      setEmail('');
      setPhone('');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la alerta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Bell className="h-4 w-4" />
          Avisarme cuando esté disponible
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recibir notificación</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Te avisaremos cuando <strong>{productName}</strong> vuelva a estar disponible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="alert-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="alert-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono (opcional)
            </Label>
            <Input
              id="alert-phone"
              type="tel"
              placeholder="+53 5XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Notificarme'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
