-- ============================================================
-- Public view for donation pages
-- Exposes only safe fields (excludes Mollie tokens, internal data)
-- ============================================================
CREATE VIEW public_mosques AS
  SELECT id, name, slug, city, logo_url, banner_url, primary_color,
         welcome_msg, anbi_status, rsin, language
  FROM mosques;

-- Grant public access to the view (Supabase anon role)
GRANT SELECT ON public_mosques TO anon;
GRANT SELECT ON public_mosques TO authenticated;
