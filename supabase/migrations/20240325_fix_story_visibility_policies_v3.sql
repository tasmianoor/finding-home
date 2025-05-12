-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their story visibility" ON story_visibility;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON story_visibility;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON story_visibility;
DROP POLICY IF EXISTS "Enable delete for story owners" ON story_visibility;
DROP POLICY IF EXISTS "Enable insert for story owners" ON story_visibility;
DROP POLICY IF EXISTS "Enable delete for story owners" ON story_visibility;

-- Create a single policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON story_visibility
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true); 