-- Create the signatures storage bucket for periodic gift agreement signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  2097152,  -- 2 MiB
  ARRAY['image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: only service_role can upload (API routes use admin client)
-- Read access: authenticated users can read signatures for their mosque's agreements
CREATE POLICY "Authenticated users can read own mosque signatures"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures'
    AND auth.role() = 'authenticated'
  );
