# Supabase Setup Guide

**When to do this:** Before deploying to staging (Phase 1+). Not needed for local development.

Local development uses `supabase start` with Docker -- no cloud project needed.

---

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up with **GitHub** (fastest) or email/password
4. Confirm your email if prompted

## Step 2: Create the Staging Project

1. Click **New Project**
2. If prompted to create an organization:
   - Organization name: **Bunyan**
   - Plan: Free (upgrade later)
3. Fill in project details:
   - Project name: **bunyan-staging**
   - Database password: click **Generate a password** and **save it in your password manager immediately**
   - Region: **West EU (eu-west-1)** -- closest to the Netherlands
4. Click **Create new project**
5. Wait 1-2 minutes for the project to spin up (you'll see a progress screen)

## Step 3: Copy the Staging API Credentials

1. In the left sidebar, go to **Project Settings** (gear icon at the bottom)
2. Click **API** under the Configuration section
3. Copy and save these three values:
   - **Project URL** -- looks like `https://xxxxxxxx.supabase.co`
   - **anon/public key** -- under "Project API keys", the one labeled `anon` `public`
   - **service_role key** -- the one labeled `service_role` `secret` (click the eye icon to reveal it)

**Keep the service_role key secret.** Never commit it to git or expose it in the browser.

## Step 4: Create the Production Project

1. Go back to the Supabase dashboard home (click the Supabase logo top-left)
2. Click **New Project** again
3. Select the **Bunyan** organization
4. Fill in project details:
   - Project name: **bunyan-production**
   - Database password: generate a new strong password and save it
   - Region: **West EU (eu-west-1)** -- same as staging
5. Click **Create new project** and wait for it to spin up
6. Copy the same 3 values (Project URL, anon key, service_role key) from **Project Settings > API**

## Step 5: Store Everything Securely

Save all credentials in your password manager with clear labels:

| Label | Staging | Production |
|-------|---------|------------|
| Supabase Project URL | `https://xxx.supabase.co` | `https://yyy.supabase.co` |
| Supabase Anon Key | `eyJ...` | `eyJ...` |
| Supabase Service Role Key | `eyJ...` | `eyJ...` |
| Database Password | (saved earlier) | (saved earlier) |

---

**Summary:** You now have two Supabase projects (staging + production), both in EU West. The credentials will be used as environment variables when we deploy to Vercel.
