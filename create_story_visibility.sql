-- Create story_visibility table
CREATE TABLE IF NOT EXISTS story_visibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    visibility_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, visibility_type)
);

-- Enable RLS
ALTER TABLE story_visibility ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON story_visibility
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON story_visibility
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories
            WHERE id = story_visibility.story_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for story owners" ON story_visibility
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stories
            WHERE id = story_visibility.story_id
            AND user_id = auth.uid()
        )
    );

-- Create index
CREATE INDEX story_visibility_story_id_idx ON story_visibility(story_id); 