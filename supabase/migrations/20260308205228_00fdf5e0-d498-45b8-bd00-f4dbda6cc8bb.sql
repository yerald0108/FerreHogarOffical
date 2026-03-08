-- Fix duplicate notifications: add deduplication guard to notify_order_status_change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  status_label text;
  already_exists boolean;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'Confirmado';
      WHEN 'preparing' THEN status_label := 'En Preparación';
      WHEN 'shipped' THEN status_label := 'Enviado';
      WHEN 'delivered' THEN status_label := 'Entregado';
      WHEN 'cancelled' THEN status_label := 'Cancelado';
      ELSE status_label := NEW.status;
    END CASE;

    -- Dedup: check if identical notification was already created in last 5 seconds
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = NEW.user_id
        AND reference_id = NEW.id
        AND title = 'Pedido #' || UPPER(LEFT(NEW.id::text, 8)) || ' - ' || status_label
        AND created_at > now() - interval '5 seconds'
    ) INTO already_exists;

    IF NOT already_exists THEN
      INSERT INTO public.notifications (user_id, title, message, type, reference_id)
      VALUES (
        NEW.user_id,
        'Pedido #' || UPPER(LEFT(NEW.id::text, 8)) || ' - ' || status_label,
        CASE NEW.status
          WHEN 'confirmed' THEN 'Tu pedido ha sido confirmado y está siendo procesado.'
          WHEN 'preparing' THEN 'Estamos preparando tu pedido.'
          WHEN 'shipped' THEN '¡Tu pedido está en camino!'
          WHEN 'delivered' THEN '¡Tu pedido ha sido entregado!'
          WHEN 'cancelled' THEN 'Tu pedido ha sido cancelado. ' || COALESCE(NEW.cancellation_reason, '')
          ELSE 'El estado de tu pedido ha cambiado.'
        END,
        'order_update',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Also fix notify_admins_new_order with dedup guard
CREATE OR REPLACE FUNCTION public.notify_admins_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  customer_name TEXT;
  order_short_id TEXT;
  notif_title TEXT;
  already_exists boolean;
BEGIN
  SELECT full_name INTO customer_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  order_short_id := UPPER(LEFT(NEW.id::text, 8));
  notif_title := '🛒 Nuevo Pedido #' || order_short_id;

  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Dedup check
    SELECT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = admin_record.user_id
        AND reference_id = NEW.id
        AND type = 'new_order'
        AND created_at > now() - interval '5 seconds'
    ) INTO already_exists;

    IF NOT already_exists THEN
      INSERT INTO public.notifications (user_id, title, message, type, reference_id)
      VALUES (
        admin_record.user_id,
        notif_title,
        'Pedido de ' || COALESCE(customer_name, 'Cliente') || ' por ' || NEW.total_amount || ' CUP — ' || NEW.municipality || ', ' || NEW.delivery_address,
        'new_order',
        NEW.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;