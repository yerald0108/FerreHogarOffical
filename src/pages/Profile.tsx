import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Phone, Mail, MapPin, Building, Save, Loader2, Lock, Eye, EyeOff, Camera, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { getProvinceNames, getMunicipalitiesByProvince } from '@/data/cuba-locations';
import { useQueryClient } from '@tanstack/react-query';
import { SEOHead } from '@/components/SEOHead';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z.string().trim().min(8, 'El teléfono debe tener al menos 8 dígitos').max(15, 'El teléfono no puede exceder 15 dígitos'),
  email: z.string().trim().email('Email inválido').max(255, 'El email no puede exceder 255 caracteres').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'La dirección no puede exceder 500 caracteres').optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  municipality: z.string().optional().or(z.literal('')),
});

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    municipality: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const provinceNames = getProvinceNames();
  const municipalities = formData.province ? getMunicipalitiesByProvince(formData.province) : [];

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || user?.email || '',
        address: profile.address || '',
        province: profile.province || '',
        municipality: profile.municipality || '',
      });
    } else if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProvinceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, province: value, municipality: '' }));
    setHasChanges(true);
  };

  const handleMunicipalityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, municipality: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Por favor corrige los errores del formulario');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        province: formData.province || null,
        municipality: formData.municipality || null,
      } as any);
      
      toast.success('Perfil actualizado correctamente');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el perfil');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Mi Perfil" description="Gestiona tu información personal, dirección y contraseña." />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                {(profile as any)?.avatar_url ? (
                  <AvatarImage src={(profile as any).avatar_url} alt="Foto de perfil" />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error('La imagen no puede superar 2MB');
                    return;
                  }
                  setUploadingAvatar(true);
                  try {
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${user.id}/avatar.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('avatars')
                      .upload(filePath, file, { upsert: true });
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabase.storage
                      .from('avatars')
                      .getPublicUrl(filePath);
                    
                    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
                    
                    await supabase
                      .from('profiles')
                      .update({ avatar_url: avatarUrl } as any)
                      .eq('user_id', user.id);
                    
                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                    toast.success('Foto de perfil actualizada');
                  } catch (error: any) {
                    toast.error(error.message || 'Error al subir la imagen');
                  } finally {
                    setUploadingAvatar(false);
                    e.target.value = '';
                  }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Haz clic para cambiar tu foto</p>
            {(profile as any)?.avatar_url && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-destructive hover:text-destructive gap-1.5"
                disabled={uploadingAvatar}
                onClick={async () => {
                  if (!user) return;
                  setUploadingAvatar(true);
                  try {
                    // Remove from storage
                    const { error: removeError } = await supabase.storage
                      .from('avatars')
                      .remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);
                    
                    // Clear avatar_url in profile
                    await supabase
                      .from('profiles')
                      .update({ avatar_url: null } as any)
                      .eq('user_id', user.id);
                    
                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                    toast.success('Foto de perfil eliminada');
                  } catch (error: any) {
                    toast.error(error.message || 'Error al eliminar la imagen');
                  } finally {
                    setUploadingAvatar(false);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Quitar foto
              </Button>
            )}
            <h1 className="text-3xl font-bold mt-2">Mi Perfil</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tus datos para agilizar tus próximos pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Nombre completo *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Tu nombre completo"
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
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
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+53 5XXXXXXX"
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Provincia
                    </Label>
                    <Select
                      value={formData.province}
                      onValueChange={handleProvinceChange}
                    >
                      <SelectTrigger>
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
                    <Label className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Municipio
                    </Label>
                    <Select
                      value={formData.municipality}
                      onValueChange={handleMunicipalityChange}
                      disabled={!formData.province}
                    >
                      <SelectTrigger>
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
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Dirección
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Calle, número, entre calles, edificio, apartamento..."
                    rows={3}
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address}</p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    type="submit" 
                    disabled={updateProfile.isPending || !hasChanges}
                    className="min-w-[140px]"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!passwordData.current) {
                    toast.error('Debes ingresar tu contraseña actual');
                    return;
                  }
                  if (passwordData.newPass.length < 6) {
                    toast.error('La nueva contraseña debe tener al menos 6 caracteres');
                    return;
                  }
                  if (passwordData.newPass !== passwordData.confirm) {
                    toast.error('Las contraseñas no coinciden');
                    return;
                  }
                  setChangingPassword(true);
                  try {
                    // Verify current password by re-authenticating
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                      email: user.email!,
                      password: passwordData.current,
                    });
                    if (signInError) {
                      toast.error('La contraseña actual es incorrecta');
                      return;
                    }
                    const { error } = await supabase.auth.updateUser({
                      password: passwordData.newPass,
                    });
                    if (error) throw error;
                    toast.success('Contraseña actualizada correctamente');
                    setPasswordData({ current: '', newPass: '', confirm: '' });
                  } catch (error: any) {
                    toast.error(error.message || 'Error al cambiar la contraseña');
                  } finally {
                    setChangingPassword(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPass">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPass"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
                      placeholder="Ingresa tu contraseña actual"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPass">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPass"
                      type={showPasswords.newPass ? 'text' : 'password'}
                      value={passwordData.newPass}
                      onChange={(e) => setPasswordData((p) => ({ ...p, newPass: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, newPass: !p.newPass }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPasswords.newPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData((p) => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repite la nueva contraseña"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={changingPassword || !passwordData.current || !passwordData.newPass}>
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      'Cambiar contraseña'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
