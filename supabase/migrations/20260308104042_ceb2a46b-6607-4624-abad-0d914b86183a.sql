
-- 1. Banners table for dynamic hero
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text DEFAULT '',
  image_url text NOT NULL,
  link_url text DEFAULT '/productos',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL USING (is_admin(auth.uid()));

-- 2. Price history table
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history" ON public.price_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert price history" ON public.price_history
  FOR INSERT WITH CHECK (true);

-- Trigger to log price changes
CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.price_history (product_id, price, changed_at)
    VALUES (NEW.id, NEW.price, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_price_change
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_price_change();

-- Insert current prices as initial history
INSERT INTO public.price_history (product_id, price, changed_at)
SELECT id, price, created_at FROM public.products;

-- 3. Product views table
CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view analytics" ON public.product_views
  FOR SELECT USING (is_admin(auth.uid()));

-- 4. Shared wishlists table
CREATE TABLE public.shared_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  share_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create shared wishlists" ON public.shared_wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wishlists" ON public.shared_wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view by share_code" ON public.shared_wishlists
  FOR SELECT USING (true);
