-- Enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to read buckets
CREATE POLICY "Allow authenticated users to read buckets"
ON storage.buckets
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Create the memories bucket if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'memories'
  ) THEN
    INSERT INTO storage.buckets (id, name, owner, public)
    VALUES ('memories', 'memories', auth.uid(), false);
  END IF;
END $$;

-- Drop existing policies for memories bucket
DROP POLICY IF EXISTS "memories_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "memories_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "memories_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "memories_delete_policy" ON storage.objects;

-- Create new policies for memories bucket
-- Allow authenticated users to upload files
CREATE POLICY "memories_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'memories' AND
    auth.role() = 'authenticated'
);

-- Allow authenticated users to read files
CREATE POLICY "memories_read_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'memories');

-- Allow authenticated users to update their own files
CREATE POLICY "memories_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'memories' AND
    auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "memories_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'memories' AND
    auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 