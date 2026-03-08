
-- Product images table for multiple images per product
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view product images
CREATE POLICY "Anyone can view product images" ON public.product_images
FOR SELECT USING (true);

-- Admins and gestors can manage product images
CREATE POLICY "Admins and gestors can insert product images" ON public.product_images
FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR public.is_gestor(auth.uid()));

CREATE POLICY "Admins and gestors can update product images" ON public.product_images
FOR UPDATE USING (public.is_admin(auth.uid()) OR public.is_gestor(auth.uid()));

CREATE POLICY "Admins and gestors can delete product images" ON public.product_images
FOR DELETE USING (public.is_admin(auth.uid()) OR public.is_gestor(auth.uid()));
