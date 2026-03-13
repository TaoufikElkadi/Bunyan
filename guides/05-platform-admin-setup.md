# Platform Admin Setup

Platform admins have full cross-tenant access to all mosques on the Bunyan platform.

## How to Grant Platform Admin Access

Platform admin is set via Supabase Auth `app_metadata` (cannot be self-assigned by users).

### Option 1: Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email
3. Click the user → Edit → Raw User Meta Data is NOT what you want
4. Use the SQL Editor instead (see Option 2)

### Option 2: SQL (recommended)
```sql
-- Replace USER_EMAIL with the target user's email
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"platform_role": "platform_admin"}'::jsonb
WHERE email = 'USER_EMAIL';
```

### Option 3: Supabase CLI
```bash
# Get the user's auth ID first, then:
supabase auth admin update USER_ID --app-metadata '{"platform_role": "platform_admin"}'
```

## Verifying Access

After setting the metadata, the user can access `/admin` in their browser. Non-platform-admin users are redirected to `/dashboard`.

## Revoking Access

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'platform_role'
WHERE email = 'USER_EMAIL';
```
