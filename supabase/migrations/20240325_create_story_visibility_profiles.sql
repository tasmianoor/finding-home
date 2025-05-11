BEGIN;

-- Create story_visibility_profiles table
CREATE TABLE IF NOT EXISTS public.story_visibility_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visibility_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, profile_id, visibility_type)
);

-- Enable RLS
ALTER TABLE public.story_visibility_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.story_visibility_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for story owners" ON public.story_visibility_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_visibility_profiles.story_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for story owners" ON public.story_visibility_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_visibility_profiles.story_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for story owners" ON public.story_visibility_profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_visibility_profiles.story_id
            AND user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX story_visibility_profiles_story_id_idx ON public.story_visibility_profiles(story_id);
CREATE INDEX story_visibility_profiles_profile_id_idx ON public.story_visibility_profiles(profile_id);
CREATE INDEX story_visibility_profiles_visibility_type_idx ON public.story_visibility_profiles(visibility_type);

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.story_visibility_profiles
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at);

COMMIT; 