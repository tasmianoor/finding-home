-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON story_visibility_profiles;
DROP POLICY IF EXISTS "Enable insert for story owners" ON story_visibility_profiles;
DROP POLICY IF EXISTS "Enable update for story owners" ON story_visibility_profiles;
DROP POLICY IF EXISTS "Enable delete for story owners" ON story_visibility_profiles;

-- Create new policies with simplified logic to prevent recursion
CREATE POLICY "Enable read access for authenticated users"
ON story_visibility_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for story owners"
ON story_visibility_profiles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stories
        WHERE id = story_visibility_profiles.story_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Enable update for story owners"
ON story_visibility_profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM stories
        WHERE id = story_visibility_profiles.story_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete for story owners"
ON story_visibility_profiles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM stories
        WHERE id = story_visibility_profiles.story_id
        AND user_id = auth.uid()
    )
); 