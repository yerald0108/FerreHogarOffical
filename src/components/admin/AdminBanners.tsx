import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Image, Link as LinkIcon, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

function useBanners() {
  return useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });
}

export function AdminBanners() {
  const { data: banners, isLoading } = useBanners();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', image_url: '', link_url: '/productos',
    is_active: true, display_order: 0,
  });

  const resetForm = () => {
    setForm({ title: '', subtitle: '', image_url: '', link_url: '/productos', is_active: true, display_order: 0 });
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('banners').update({
          title: data.title, subtitle: data.subtitle, image_url: data.image_url,
          link_url: data.link_url, is_active: data.is_active, display_order: data.display_order,
        }).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert({
          title: data.title, subtitle: data.subtitle, image_url: data.image_url,
          link_url: data.link_url, is_active: data.is_active, display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(editingId ? 'Banner actualizado' : 'Banner creado');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner eliminado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title: b.title, subtitle: b.subtitle, image_url: b.image_url,
      link_url: b.link_url, is_active: b.is_active, display_order: b.display_order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      toast.error('Título e imagen son obligatorios');
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
        <span className="text-sm text-muted-foreground">{banners?.length || 0} banners</span>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Banner' : 'Nuevo Banner'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título del banner" required />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Texto secundario" />
              </div>
              <div className="space-y-2">
                <Label>URL de Imagen *</Label>
                <Input value={form.image_url} onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." required />
              </div>
              <div className="space-y-2">
                <Label>Enlace (al hacer clic)</Label>
                <Input value={form.link_url} onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="/productos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Activo</Label>
                </div>
              </div>
              {form.image_url && (
                <div className="rounded-lg overflow-hidden border aspect-[21/9]">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? 'Guardar cambios' : 'Crear banner'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {banners?.map((b) => (
          <Card key={b.id} className={`p-4 ${!b.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="w-24 h-14 rounded overflow-hidden bg-muted shrink-0">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{b.title}</p>
                {b.subtitle && <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <LinkIcon className="h-3 w-3" /> {b.link_url}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={b.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: b.id, is_active: v })} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                  if (confirm('¿Eliminar este banner?')) deleteMutation.mutate(b.id);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {banners?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
            No hay banners. Crea uno para personalizar el hero.
          </div>
        )}
      </div>
    </div>
  );
}
