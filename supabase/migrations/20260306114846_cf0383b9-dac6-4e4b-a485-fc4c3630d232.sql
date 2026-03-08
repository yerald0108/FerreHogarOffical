-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create stock_alerts table for "notify me when back in stock"
CREATE TABLE public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  email text,
  phone text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone can create a stock alert (even anonymous)
CREATE POLICY "Anyone can create stock alerts"
ON public.stock_alerts FOR INSERT
WITH CHECK (true);

-- Users can view their own alerts, admins can view all
CREATE POLICY "Users can view own alerts or admins all"
ON public.stock_alerts FOR SELECT
USING (
  (user_id = auth.uid()) OR is_admin(auth.uid())
);

-- Admins can update/delete alerts
CREATE POLICY "Admins can manage alerts"
ON public.stock_alerts FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete alerts"
ON public.stock_alerts FOR DELETE
USING (is_admin(auth.uid()));