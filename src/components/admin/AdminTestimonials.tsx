import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Star, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Testimonial {
  id: string;
  name: string;
  text: string;
  location: string;
  rating: number;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

function useTestimonials() {
  return useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });
}

export function AdminTestimonials() {
  const { data: testimonials, isLoading } = useTestimonials();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', text: '', location: '', rating: 5, is_visible: true, display_order: 0 });

  const resetForm = () => {
    setForm({ name: '', text: '', location: '', rating: 5, is_visible: true, display_order: 0 });
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('testimonials').update({
          name: data.name, text: data.text, location: data.location,
          rating: data.rating, is_visible: data.is_visible, display_order: data.display_order,
        }).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonials').insert({
          name: data.name, text: data.text, location: data.location,
          rating: data.rating, is_visible: data.is_visible, display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success(editingId ? 'Testimonio actualizado' : 'Testimonio creado');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testimonio eliminado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('testimonials').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({ name: t.name, text: t.text, location: t.location, rating: t.rating, is_visible: t.is_visible, display_order: t.display_order });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error('Nombre y texto son obligatorios');
      return;
    }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{testimonials?.length || 0} testimonios</span>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Testimonio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Testimonio' : 'Nuevo Testimonio'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del cliente" required />
              </div>
              <div className="space-y-2">
                <Label>Testimonio *</Label>
                <Textarea value={form.text} onChange={(e) => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Texto del testimonio" rows={3} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="La Habana" />
                </div>
                <div className="space-y-2">
                  <Label>Valoración (1-5)</Label>
                  <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm(f => ({ ...f, rating: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_visible} onCheckedChange={(v) => setForm(f => ({ ...f, is_visible: v }))} />
                  <Label>Visible</Label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? 'Guardar cambios' : 'Crear testimonio'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {testimonials?.map((t) => (
          <Card key={t.id} className={`p-4 ${!t.is_visible ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{t.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < t.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.text}</p>
                {t.location && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t.location}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={t.is_visible}
                  onCheckedChange={(v) => toggleVisibility.mutate({ id: t.id, is_visible: v })}
                />
                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('¿Eliminar este testimonio?')) deleteMutation.mutate(t.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {testimonials?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay testimonios. Crea uno para empezar.
          </div>
        )}
      </div>
    </div>
  );
}
