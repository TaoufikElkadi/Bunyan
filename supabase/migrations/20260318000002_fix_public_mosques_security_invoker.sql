-- Fix: public_mosques view should use SECURITY INVOKER (the default is DEFINER,
-- which bypasses the querying user's RLS policies).
CREATE OR REPLACE VIEW public_mosques
  WITH (security_invoker = true)
AS
  SELECT id, name, slug, city, logo_url, banner_url, primary_color,
         welcome_msg, anbi_status, rsin, language
  FROM mosques;
