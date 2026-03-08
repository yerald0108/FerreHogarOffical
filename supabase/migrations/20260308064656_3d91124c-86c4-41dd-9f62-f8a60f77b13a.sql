-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- RLS policies for product images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins and gestors can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (public.is_admin(auth.uid()) OR public.is_gestor(auth.uid()))
);

CREATE POLICY "Admins and gestors can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND (public.is_admin(auth.uid()) OR public.is_gestor(auth.uid()))
);

CREATE POLICY "Admins and gestors can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (public.is_admin(auth.uid()) OR public.is_gestor(auth.uid()))
);
