-- Drop existing policies
DROP POLICY IF EXISTS "Comments are viewable by verified family members" ON public.comments;
DROP POLICY IF EXISTS "Verified family members can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Create new policies
CREATE POLICY "Comments are viewable by anyone"
ON public.comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON public.comments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id); 