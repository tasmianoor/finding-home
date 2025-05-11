-- Enable RLS on story_tags table
ALTER TABLE story_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view story tags" ON story_tags;
DROP POLICY IF EXISTS "Users can add story tags" ON story_tags;
DROP POLICY IF EXISTS "Users can delete story tags" ON story_tags;

-- Create policy to allow users to view tags for stories they have access to
CREATE POLICY "Users can view story tags"
ON story_tags
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM stories
        WHERE id = story_tags.story_id
        AND (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM story_visibility
                WHERE story_id = stories.id
                AND visibility_type = 'public'
            )
        )
    )
);

-- Create policy to allow users to add tags to their own stories
CREATE POLICY "Users can add story tags"
ON story_tags
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stories
        WHERE id = story_tags.story_id
        AND user_id = auth.uid()
    )
);

-- Create policy to allow users to delete tags from their own stories
CREATE POLICY "Users can delete story tags"
ON story_tags
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM stories
        WHERE id = story_tags.story_id
        AND user_id = auth.uid()
    )
); 