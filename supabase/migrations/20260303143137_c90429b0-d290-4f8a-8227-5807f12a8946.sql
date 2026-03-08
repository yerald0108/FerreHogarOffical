
-- Add 'gestor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';

-- Add created_by column to products to track who published each product
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
