-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their story visibility" ON story_visibility;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON story_visibility;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON story_visibility;
DROP POLICY IF EXISTS "Enable delete for story owners" ON story_visibility;

-- Create new policies with simplified logic to prevent recursion
CREATE POLICY "Enable read access for authenticated users"
ON story_visibility
FOR SELECT
TO authenticated
USING (true);

-- Simplified insert policy that only checks the user_id in the stories table
CREATE POLICY "Enable insert for story owners"
ON story_visibility
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT user_id 
        FROM stories 
        WHERE id = story_visibility.story_id
    )
);

-- Simplified delete policy that only checks the user_id in the stories table
CREATE POLICY "Enable delete for story owners"
ON story_visibility
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM stories 
        WHERE id = story_visibility.story_id
    )
); 