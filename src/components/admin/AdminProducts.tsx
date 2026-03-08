import { useState, useEffect, useRef } from 'react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Search, X, Upload, ImageIcon, ChevronLeft, Download } from 'lucide-react';
import { useAdminProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, Product } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'MLC', label: 'MLC' },
  { value: 'Zelle', label: 'Zelle (USD)' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo (CUP)' },
  { value: 'transfermovil', label: 'Transfermóvil' },
  { value: 'enzona', label: 'EnZona' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'usd', label: 'USD efectivo' },
  { value: 'eur', label: 'EUR efectivo' },
  { value: 'tarjeta_clasica', label: 'Tarjeta Clásica' },
  { value: 'mlc', label: 'Tarjeta MLC' },
];

interface PriceEntry {
  currency: string;
  price: string;
}

interface GalleryImage {
  id?: string;
  image_url: string;
  display_order: number;
  isNew?: boolean;
}

export function AdminProducts({ gestorMode = false }: { gestorMode?: boolean }) {
  const { data: products, isLoading } = useAdminProducts();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    stock: '',
    image_url: '',
    category_id: '',
    is_active: true,
  });
  const [extraPrices, setExtraPrices] = useState<PriceEntry[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', compare_at_price: '', stock: '', image_url: '', category_id: '', is_active: true });
    setExtraPrices([]);
    setSelectedPaymentMethods([]);
    setEditingProduct(null);
    setImagePreview(null);
    setGalleryImages([]);
  };

  const loadProductExtras = async (productId: string) => {
    setLoadingExtras(true);
    const [pricesRes, methodsRes, imagesRes] = await Promise.all([
      supabase.from('product_prices').select('*').eq('product_id', productId),
      supabase.from('product_payment_methods').select('*').eq('product_id', productId),
      supabase.from('product_images').select('*').eq('product_id', productId).order('display_order'),
    ]);
    if (pricesRes.data) {
      setExtraPrices(pricesRes.data.map((p: any) => ({ currency: p.currency, price: p.price.toString() })));
    }
    if (methodsRes.data) {
      setSelectedPaymentMethods(methodsRes.data.map((m: any) => m.method));
    }
    if (imagesRes.data) {
      setGalleryImages(imagesRes.data.map((img: any) => ({
        id: img.id,
        image_url: img.image_url,
        display_order: img.display_order,
      })));
    }
    setLoadingExtras(false);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: (product as any).compare_at_price?.toString() || '',
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      is_active: product.is_active,
    });
    loadProductExtras(product.id);
    setIsDialogOpen(true);
  };

  const addPriceEntry = () => {
    setExtraPrices(prev => [...prev, { currency: '', price: '' }]);
  };

  const removePriceEntry = (index: number) => {
    setExtraPrices(prev => prev.filter((_, i) => i !== index));
  };

  const updatePriceEntry = (index: number, field: 'currency' | 'price', value: string) => {
    setExtraPrices(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const saveProductExtras = async (productId: string) => {
    // Delete existing and re-insert prices
    await supabase.from('product_prices').delete().eq('product_id', productId);
    const validPrices = extraPrices.filter(p => p.currency && p.price);
    if (validPrices.length > 0) {
      await supabase.from('product_prices').insert(
        validPrices.map(p => ({ product_id: productId, currency: p.currency, price: parseFloat(p.price) }))
      );
    }

    // Delete existing and re-insert payment methods
    await supabase.from('product_payment_methods').delete().eq('product_id', productId);
    if (selectedPaymentMethods.length > 0) {
      await supabase.from('product_payment_methods').insert(
        selectedPaymentMethods.map(m => ({ product_id: productId, method: m }))
      );
    }

    // Save gallery images - delete existing and re-insert
    await supabase.from('product_images').delete().eq('product_id', productId);
    if (galleryImages.length > 0) {
      await supabase.from('product_images').insert(
        galleryImages.map((img, i) => ({
          product_id: productId,
          image_url: img.image_url,
          display_order: i,
        }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      stock: parseInt(formData.stock),
      image_url: formData.image_url || null,
      category_id: formData.category_id || null,
      is_active: formData.is_active,
    };

    try {
      if (editingProduct) {
        const previousStock = editingProduct.stock;
        const newStock = parseInt(formData.stock);
        
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        await saveProductExtras(editingProduct.id);
        
        // If stock went from 0 to >0, notify subscribers
        if (previousStock <= 0 && newStock > 0) {
          supabase.functions.invoke('send-back-in-stock-email', {
            body: { productId: editingProduct.id },
          }).then(() => {
            console.log('Back-in-stock notifications sent');
          }).catch((err) => {
            console.error('Error sending back-in-stock notifications:', err);
          });
        }
        
        toast.success('Producto actualizado correctamente');
      } else {
        const created = await createProduct.mutateAsync(productData);
        await saveProductExtras(created.id);
        toast.success('Producto creado correctamente');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este producto?')) return;

    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Producto desactivado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar el producto');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(price);
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (gestorMode && user) {
      return matchesSearch && (p as any).created_by === user.id;
    }
    return matchesSearch;
  });

  const exportProductsCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) return;
    const headers = ['Nombre', 'Precio (CUP)', 'Stock', 'Categoría', 'Activo', 'Creado'];
    const rows = filteredProducts.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.price,
      p.stock,
      `"${p.categories?.name || ''}"`,
      p.is_active ? 'Sí' : 'No',
      new Date(p.created_at).toLocaleDateString('es-CU'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Productos exportados a CSV');
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
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportProductsCSV} disabled={!filteredProducts || filteredProducts.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            </DialogHeader>

            {loadingExtras ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (CUP) *</Label>
                    <Input id="price" type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compare_at_price">Precio anterior</Label>
                    <Input id="compare_at_price" type="number" min="0" step="0.01" placeholder="Precio sin descuento" value={formData.compare_at_price} onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))} required />
                  </div>
                </div>

                {/* Extra Prices */}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Precios en otras monedas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPriceEntry} className="gap-1">
                      <Plus className="h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  {extraPrices.map((entry, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select value={entry.currency} onValueChange={(v) => updatePriceEntry(index, 'currency', v)}>
                          <SelectTrigger><SelectValue placeholder="Moneda" /></SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input type="number" min="0" step="0.01" placeholder="Precio" value={entry.price} onChange={(e) => updatePriceEntry(index, 'price', e.target.value)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removePriceEntry(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Payment Methods */}
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Métodos de pago aceptados</Label>
                  <p className="text-xs text-muted-foreground">Selecciona los métodos de pago disponibles para este producto. Estos se mostrarán en el checkout.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHOD_OPTIONS.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pm-${option.value}`}
                          checked={selectedPaymentMethods.includes(option.value)}
                          onCheckedChange={() => togglePaymentMethod(option.value)}
                        />
                        <Label htmlFor={`pm-${option.value}`} className="text-sm cursor-pointer">{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}><span className="flex items-center gap-1.5"><CategoryIcon iconName={cat.icon} className="h-4 w-4" />{cat.name}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Imagen del producto</Label>
                  <div className="space-y-3">
                    {(imagePreview || formData.image_url) && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                        <img src={imagePreview || formData.image_url} alt="Vista previa" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => { setFormData(prev => ({ ...prev, image_url: '' })); setImagePreview(null); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('La imagen no puede superar los 5MB');
                            return;
                          }
                          setUploading(true);
                          setImagePreview(URL.createObjectURL(file));
                          const ext = file.name.split('.').pop();
                          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                          const { data, error } = await supabase.storage
                            .from('product-images')
                            .upload(fileName, file, { cacheControl: '3600', upsert: false });
                          if (error) {
                            toast.error('Error al subir imagen: ' + error.message);
                            setImagePreview(null);
                          } else {
                            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
                            setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
                            toast.success('Imagen subida correctamente');
                          }
                          setUploading(false);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 flex-1"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">o usar URL</span></div>
                    </div>
                    <Input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => { setFormData(prev => ({ ...prev, image_url: e.target.value })); setImagePreview(null); }}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Gallery Images */}
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Galería de imágenes adicionales</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sube fotos adicionales del producto. Se mostrarán junto a la imagen principal.
                  </p>
                  
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {galleryImages.map((img, index) => (
                        <div key={img.id || index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                          <img src={img.image_url} alt={`Galería ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const newImages = [...galleryImages];
                                  [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                                  setGalleryImages(newImages);
                                }}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      
                      setUploadingGallery(true);
                      const newImages: GalleryImage[] = [];
                      
                      for (const file of files) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(`${file.name} supera los 5MB`);
                          continue;
                        }
                        const ext = file.name.split('.').pop();
                        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const { data, error } = await supabase.storage
                          .from('product-images')
                          .upload(fileName, file, { cacheControl: '3600', upsert: false });
                        
                        if (error) {
                          toast.error(`Error subiendo ${file.name}`);
                        } else {
                          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
                          newImages.push({
                            image_url: urlData.publicUrl,
                            display_order: galleryImages.length + newImages.length,
                            isNew: true,
                          });
                        }
                      }
                      
                      setGalleryImages(prev => [...prev, ...newImages]);
                      if (newImages.length > 0) toast.success(`${newImages.length} imagen(es) subida(s)`);
                      setUploadingGallery(false);
                      if (galleryInputRef.current) galleryInputRef.current.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 w-full"
                    disabled={uploadingGallery}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {uploadingGallery ? 'Subiendo...' : 'Añadir fotos a la galería'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Producto Activo</Label>
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                    {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProducts?.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex gap-4">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      {!product.is_active && <Badge variant="secondary">Inactivo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                      <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                      <span className="text-muted-foreground">Stock: {product.stock}</span>
                      {product.categories && (
                        <Badge variant="outline">{product.categories.icon} {product.categories.name}</Badge>
                      )}
                      {product.creator_name && (
                        <span className="text-xs text-muted-foreground">Publicado por: {product.creator_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredProducts?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No se encontraron productos</div>
        )}
      </div>
    </div>
  );
}
