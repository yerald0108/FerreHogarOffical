import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Search, Tag } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { IconPicker } from '@/components/admin/IconPicker';
import { useCategories } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminCategories() {
  const { data: categories, isLoading } = useCategories();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '' });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', icon: '' });
    setEditingId(null);
  };

  const openEdit = (cat: { id: string; name: string; icon: string | null }) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, icon: cat.icon || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name.trim(), icon: formData.icon.trim() || null })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Categoría actualizada');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name: formData.name.trim(), icon: formData.icon.trim() || null });
        if (error) throw error;
        toast.success('Categoría creada');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? Los productos en esta categoría perderán su categoría.`)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Categoría eliminada');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const filtered = categories?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nombre *</Label>
                <Input
                  id="cat-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Herramientas eléctricas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Icono</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((cat) => (
          <Card key={cat.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <CategoryIcon iconName={cat.icon} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(cat.created_at), "d MMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id, cat.name)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {filtered?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No se encontraron categorías
          </div>
        )}
      </div>
    </div>
  );
}
