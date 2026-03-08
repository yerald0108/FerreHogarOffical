
-- Create is_gestor function
CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'gestor'
  )
$$;

-- Create has_role function for flexible role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Allow gestors to insert products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins and gestors can insert products"
ON public.products
FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR is_gestor(auth.uid()));

-- Allow gestors to update their own products, admins can update all
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update all products gestors own"
ON public.products
FOR UPDATE
USING (is_admin(auth.uid()) OR (is_gestor(auth.uid()) AND created_by = auth.uid()));

-- Allow admins to manage user roles (insert)
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to delete user roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (is_admin(auth.uid()));
