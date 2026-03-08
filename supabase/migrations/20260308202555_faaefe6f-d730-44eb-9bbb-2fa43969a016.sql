-- Remove duplicate triggers on orders table, keeping the prefixed ones

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_change_notify ON public.orders;
DROP TRIGGER IF EXISTS on_order_created_increment_coupon ON public.orders;
DROP TRIGGER IF EXISTS trigger_stock_on_order_status ON public.orders;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;