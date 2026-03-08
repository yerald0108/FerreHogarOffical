
-- Trigger to increment coupon current_uses when order is placed with a coupon
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL AND NEW.coupon_code != '' THEN
    UPDATE public.coupons
    SET current_uses = current_uses + 1
    WHERE code = NEW.coupon_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_created_increment_coupon
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coupon_usage();
