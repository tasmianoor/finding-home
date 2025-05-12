-- Drop existing policies
DROP POLICY IF EXISTS "Stories are viewable by verified family members only" ON stories;
DROP POLICY IF EXISTS "Users can create stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

-- Create new policies with simplified logic
CREATE POLICY "Enable read access for authenticated users"
ON stories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON stories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for story owners"
ON stories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for story owners"
ON stories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 