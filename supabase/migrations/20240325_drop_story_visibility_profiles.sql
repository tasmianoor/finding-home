-- Drop the story_visibility_profiles table and its related objects
DROP TABLE IF EXISTS public.story_visibility_profiles CASCADE;

-- Drop any related indexes if they exist
DROP INDEX IF EXISTS story_visibility_profiles_story_id_idx;
DROP INDEX IF EXISTS story_visibility_profiles_profile_id_idx;
DROP INDEX IF EXISTS story_visibility_profiles_visibility_type_idx; 