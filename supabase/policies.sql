-- Enable RLS on stories table
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own stories
CREATE POLICY "Users can create their own stories"
ON stories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own stories
CREATE POLICY "Users can update their own stories"
ON stories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read stories
CREATE POLICY "Users can read stories"
ON stories
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow users to delete their own stories
CREATE POLICY "Users can delete their own stories"
ON stories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 