import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Search, User, Mail, Phone, Calendar, Shield, MapPin, Package, Wrench } from 'lucide-react';
import { useAdminUsers, UserWithRole } from '@/hooks/useAdminStats';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function UserDetailPanel({ user, onClose, onUserUpdated }: { user: UserWithRole; onClose: () => void; onUserUpdated: (updated: UserWithRole) => void }) {
  const [isTogglingGestor, setIsTogglingGestor] = useState(false);
  const [localIsGestor, setLocalIsGestor] = useState(user.role === 'gestor');
  const queryClient = useQueryClient();

  // Sync local state when user prop changes
  useEffect(() => {
    setLocalIsGestor(user.role === 'gestor');
  }, [user.role]);

  const { data: gestorProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['gestor-products', user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('created_by', user.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: localIsGestor || user.role === 'admin',
  });

  const toggleGestor = async () => {
    setIsTogglingGestor(true);
    try {
      if (localIsGestor) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'gestor');
        if (error) throw error;
        setLocalIsGestor(false);
        onUserUpdated({ ...user, role: 'user' });
        toast.success(`${user.full_name} ya no es gestor`);
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.user_id, role: 'gestor' });
        if (error) throw error;
        setLocalIsGestor(true);
        onUserUpdated({ ...user, role: 'gestor' });
        toast.success(`${user.full_name} ahora es gestor`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar rol');
    }
    setIsTogglingGestor(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(price);

  return (
    <DialogContent className="max-w-lg max-h-[85vh] p-0">
      <DialogHeader className="p-6 pb-4">
        <DialogTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="block">{user.full_name}</span>
            <Badge
              variant={user.role === 'admin' ? 'default' : localIsGestor ? 'outline' : 'secondary'}
              className="mt-1"
            >
              {user.role === 'admin' ? 'Admin' : localIsGestor ? 'Gestor' : 'Usuario'}
            </Badge>
          </div>
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh]">
        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Información de contacto</h3>
            <div className="space-y-2">
              {user.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.phone}</span>
              </div>
              {(user.province || user.municipality) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {[user.municipality, user.province].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {user.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-foreground">{user.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  Registrado el {format(new Date(user.created_at), "d 'de' MMMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>

          {user.role !== 'admin' && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Gestor de productos</Label>
                <p className="text-xs text-muted-foreground">
                  Permite al usuario agregar y gestionar productos
                </p>
              </div>
              <Switch
                checked={localIsGestor}
                onCheckedChange={toggleGestor}
                disabled={isTogglingGestor}
              />
            </div>
          )}

          {localIsGestor && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Historial de publicaciones
              </h3>
              {productsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : gestorProducts && gestorProducts.length > 0 ? (
                <div className="space-y-2">
                  {gestorProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(product.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary">{formatPrice(product.price)}</p>
                        <Badge variant={product.is_active ? 'outline' : 'secondary'} className="text-[10px]">
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ha publicado productos aún
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  const handleUserUpdated = (updated: UserWithRole) => {
    setSelectedUser(updated);
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <Badge variant="default"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    if (role === 'gestor') return <Badge variant="outline" className="border-primary/50 text-primary"><Wrench className="h-3 w-3 mr-1" />Gestor</Badge>;
    return <Badge variant="secondary">Usuario</Badge>;
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredUsers?.length || 0} usuarios registrados
        </div>
      </div>

      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email || 'Sin email'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {user.phone}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="md:hidden space-y-4">
        {filteredUsers?.map((user) => (
          <Card
            key={user.id}
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setSelectedUser(user)}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{user.full_name}</h3>
                  {getRoleBadge(user.role)}
                </div>
                <div className="mt-2 space-y-1">
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Desde {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredUsers?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron usuarios
          </div>
        )}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} onUserUpdated={handleUserUpdated} />}
      </Dialog>
    </div>
  );
}
