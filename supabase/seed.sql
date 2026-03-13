-- Development seed data for Bunyan
-- Creates platform superuser + a single mosque with three funds.

-- Platform superuser (taoufik.elkadi@gmail.com / admin12345)
-- GoTrue requires all token/change columns to be empty strings, not NULL.
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone, phone_change, phone_change_token,
  reauthentication_token,
  is_sso_user, is_anonymous,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'taoufik.elkadi@gmail.com',
  crypt('admin12345', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"], "platform_role": "platform_admin"}'::jsonb,
  '{"name": "Taoufik El Kadi"}'::jsonb,
  'authenticated',
  'authenticated',
  '', '',
  '', '', '',
  '', '', '',
  '',
  FALSE, FALSE,
  NOW(),
  NOW()
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'taoufik.elkadi@gmail.com'),
  'email',
  'a0000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
);

-- Mosque: An-Nasr
INSERT INTO mosques (id, name, slug, city, primary_color, language, plan, anbi_status)
VALUES (
  gen_random_uuid(),
  'Moskee An-Nasr',
  'an-nasr',
  'Amsterdam',
  '#10b981',
  'nl',
  'free',
  FALSE
);

-- Link platform user to An-Nasr mosque
INSERT INTO users (id, mosque_id, name, email, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  (SELECT id FROM mosques WHERE slug = 'an-nasr'),
  'Taoufik El Kadi',
  'taoufik.elkadi@gmail.com',
  'admin'
);

-- Funds for An-Nasr
INSERT INTO funds (id, mosque_id, name, sort_order)
VALUES
  (gen_random_uuid(), (SELECT id FROM mosques WHERE slug = 'an-nasr'), 'Algemeen', 0),
  (gen_random_uuid(), (SELECT id FROM mosques WHERE slug = 'an-nasr'), 'Moskee',   1),
  (gen_random_uuid(), (SELECT id FROM mosques WHERE slug = 'an-nasr'), 'Zakat',    2);
