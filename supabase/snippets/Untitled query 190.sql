UPDATE auth.users
SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{platform_role}', '"platform_admin"')
WHERE email = 'taoufik.elkadi@gmail.com';