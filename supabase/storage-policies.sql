-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] IN ('images', 'audio')
);

-- Policy to allow authenticated users to read files
CREATE POLICY "Anyone can read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'stories');

-- Policy to allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'stories' AND owner = auth.uid());

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'stories' AND owner = auth.uid()); 