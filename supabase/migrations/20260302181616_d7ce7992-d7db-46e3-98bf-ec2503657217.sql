
-- Add province column to orders table
ALTER TABLE public.orders ADD COLUMN province text;

-- Add province column to profiles table
ALTER TABLE public.profiles ADD COLUMN province text;
