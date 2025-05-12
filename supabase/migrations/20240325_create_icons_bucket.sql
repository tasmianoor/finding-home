-- Enable RLS on storage.buckets if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create the icons bucket if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'icons'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('icons', 'icons', true);
  END IF;
END $$;

-- Drop existing policies for icons bucket if they exist
DROP POLICY IF EXISTS "icons_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "icons_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "icons_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "icons_delete_policy" ON storage.objects;

-- Create new policies for icons bucket
-- Allow authenticated users to upload files
CREATE POLICY "icons_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'icons' AND
    auth.role() = 'authenticated'
);

-- Allow public to read files
CREATE POLICY "icons_read_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'icons');

-- Allow authenticated users to update files
CREATE POLICY "icons_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'icons' AND
    auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "icons_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'icons' AND
    auth.role() = 'authenticated'
); 