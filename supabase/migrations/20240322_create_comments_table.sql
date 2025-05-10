-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow verified family members to view comments
CREATE POLICY "Comments are viewable by verified family members" ON public.comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_family_verified = true
        )
    );

-- Allow verified family members to insert their own comments
CREATE POLICY "Verified family members can insert comments" ON public.comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_family_verified = true
        ) AND
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_id AND is_published = true
        ) AND
        (parent_id IS NULL OR EXISTS (
            SELECT 1 FROM public.comments
            WHERE id = parent_id AND story_id = story_id
        ))
    );

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_family_verified = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_family_verified = true
        )
    );

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_family_verified = true
        )
    );

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- Add indexes
CREATE INDEX comments_story_id_idx ON public.comments(story_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);
CREATE INDEX comments_created_at_idx ON public.comments(created_at DESC); 