
-- 1. Order status history table
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status public.order_status,
  new_status public.order_status NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order history" ON public.order_status_history
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "System can insert history" ON public.order_status_history
FOR INSERT WITH CHECK (true);

-- Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- 2. Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons by code" ON public.coupons
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
FOR ALL USING (public.is_admin(auth.uid()));

-- Add coupon fields to orders
ALTER TABLE public.orders
  ADD COLUMN coupon_code text,
  ADD COLUMN discount_amount numeric DEFAULT 0;

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_order_amount numeric)
RETURNS TABLE(valid boolean, discount numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon record;
  v_discount numeric;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons
  WHERE code = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::numeric, 'Cupón no encontrado'::text;
    RETURN;
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN QUERY SELECT false, 0::numeric, 'Cupón expirado'::text;
    RETURN;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, 0::numeric, 'Cupón agotado'::text;
    RETURN;
  END IF;

  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT false, 0::numeric, ('Monto mínimo: ' || v_coupon.min_order_amount)::text;
    RETURN;
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND(p_order_amount * v_coupon.discount_value / 100, 2);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_amount);
  END IF;

  RETURN QUERY SELECT true, v_discount, ('Descuento aplicado: ' || v_discount)::text;
END;
$$;
