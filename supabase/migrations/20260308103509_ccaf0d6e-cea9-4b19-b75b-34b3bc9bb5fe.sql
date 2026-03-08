-- Allow admins to delete contact messages
CREATE POLICY "Admins can delete contact messages" ON public.contact_messages
FOR DELETE TO authenticated
USING (is_admin(auth.uid()));