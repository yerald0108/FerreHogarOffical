
-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'order_update',
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add compare_at_price for discount system
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price numeric;

-- Add tracking info and internal notes to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_info text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create trigger to auto-create notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_label text;
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

    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.user_id,
      'Pedido #' || UPPER(LEFT(NEW.id::text, 8)) || ' - ' || status_label,
      CASE NEW.status
        WHEN 'confirmed' THEN 'Tu pedido ha sido confirmado y está siendo procesado.'
        WHEN 'preparing' THEN 'Estamos preparando tu pedido.'
        WHEN 'shipped' THEN '¡Tu pedido está en camino!'
        WHEN 'delivered' THEN '¡Tu pedido ha sido entregado! ¿Confirma la recepción?'
        WHEN 'cancelled' THEN 'Tu pedido ha sido cancelado. ' || COALESCE(NEW.cancellation_reason, '')
        ELSE 'El estado de tu pedido ha cambiado.'
      END,
      'order_update',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change_notify
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();
