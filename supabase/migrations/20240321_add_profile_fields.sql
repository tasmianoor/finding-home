-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text; 