
-- Product additional prices in different currencies
CREATE TABLE public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product prices" ON public.product_prices
  FOR SELECT USING (true);

CREATE POLICY "Admins and gestors can insert product prices" ON public.product_prices
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_gestor(auth.uid()));

CREATE POLICY "Admins and gestors can update product prices" ON public.product_prices
  FOR UPDATE USING (is_admin(auth.uid()) OR is_gestor(auth.uid()));

CREATE POLICY "Admins and gestors can delete product prices" ON public.product_prices
  FOR DELETE USING (is_admin(auth.uid()) OR is_gestor(auth.uid()));

-- Product payment methods
CREATE TABLE public.product_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  method text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product payment methods" ON public.product_payment_methods
  FOR SELECT USING (true);

CREATE POLICY "Admins and gestors can insert product payment methods" ON public.product_payment_methods
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_gestor(auth.uid()));

CREATE POLICY "Admins and gestors can update product payment methods" ON public.product_payment_methods
  FOR UPDATE USING (is_admin(auth.uid()) OR is_gestor(auth.uid()));

CREATE POLICY "Admins and gestors can delete product payment methods" ON public.product_payment_methods
  FOR DELETE USING (is_admin(auth.uid()) OR is_gestor(auth.uid()));
