-- Function to reduce stock when order is confirmed
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status changes to 'confirmed', reduce stock
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE products p
    SET stock = p.stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;
  
  -- When order status changes to 'cancelled', restore stock
  IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed', 'preparing') THEN
    UPDATE products p
    SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stock management
DROP TRIGGER IF EXISTS trigger_stock_on_order_status ON orders;
CREATE TRIGGER trigger_stock_on_order_status
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_order_confirm();

-- Function to check stock availability (can be called from frontend before order)
CREATE OR REPLACE FUNCTION public.check_stock_availability(p_items jsonb)
RETURNS TABLE(product_id uuid, product_name text, requested integer, available integer, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'product_id')::uuid as product_id,
    p.name as product_name,
    (item->>'quantity')::integer as requested,
    p.stock as available,
    p.stock >= (item->>'quantity')::integer as is_available
  FROM jsonb_array_elements(p_items) as item
  JOIN products p ON p.id = (item->>'product_id')::uuid;
END;
$$;