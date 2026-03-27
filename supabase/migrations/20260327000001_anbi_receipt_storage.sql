-- Create anbi-receipts storage bucket for persistent PDF storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('anbi-receipts', 'anbi-receipts', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policy: only authenticated users can access their mosque's receipts
CREATE POLICY "Authenticated users can read own mosque receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'anbi-receipts'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can manage anbi receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'anbi-receipts')
  WITH CHECK (bucket_id = 'anbi-receipts');

-- Rename pdf_url to pdf_path for clarity (stores storage path, not a URL)
ALTER TABLE anbi_receipts RENAME COLUMN pdf_url TO pdf_path;
