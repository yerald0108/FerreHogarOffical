
-- Add is_visible column to reviews for moderation
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Allow admins to delete any review
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews or admins any"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Allow admins to update any review (for visibility toggle)
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews or admins any"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Update select policy to filter hidden reviews for non-admins
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view visible reviews or admins all"
ON public.reviews
FOR SELECT
USING (is_visible = true OR is_admin(auth.uid()));
