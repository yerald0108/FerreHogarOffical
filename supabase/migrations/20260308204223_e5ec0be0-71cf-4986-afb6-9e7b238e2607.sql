
CREATE OR REPLACE FUNCTION public.notify_admins_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  customer_name TEXT;
  order_short_id TEXT;
BEGIN
  -- Get customer name
  SELECT full_name INTO customer_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  order_short_id := UPPER(LEFT(NEW.id::text, 8));

  -- Insert notification for each admin
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      admin_record.user_id,
      '🛒 Nuevo Pedido #' || order_short_id,
      'Pedido de ' || COALESCE(customer_name, 'Cliente') || ' por ' || NEW.total_amount || ' CUP — ' || NEW.municipality || ', ' || NEW.delivery_address,
      'new_order',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order_notify_admins
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_order();
