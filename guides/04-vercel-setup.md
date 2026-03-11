# Vercel Setup Guide

**When to do this:** Before first deployment. Can wait until late Phase 1 or beyond.

---

## Step 1: Create a Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Sign up with **GitHub** (recommended -- makes repo import seamless)

## Step 2: Import the GitHub Repository

1. On the Vercel dashboard, click **Add New...** > **Project**
2. Find and select the repository: **TaoufikElkadi/Bunyan**
3. If you don't see it, click **Adjust GitHub App Permissions** to grant Vercel access

## Step 3: Configure Build Settings

1. Framework Preset: **Next.js** (should be auto-detected)
2. Root Directory: leave as default (root of the repo)
3. Build & Output Settings: leave as auto-detected
4. Click **Deploy** (you can always redeploy later with updated settings)

## Step 4: Set the Region

1. After import, go to **Project Settings** > **Functions**
2. Set the Function Region to: **Amsterdam, Netherlands (ams1)**
3. This ensures API routes run close to Dutch users and the EU Supabase instance

## Step 5: Environment Variables

1. Go to **Project Settings** > **Environment Variables**
2. Environment variables will be provided later -- you'll add entries like:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MOLLIE_CLIENT_ID`
   - `MOLLIE_CLIENT_SECRET`
   - `RESEND_API_KEY`
   - etc.
3. Use Vercel's environment scoping to set different values for **Production**, **Preview**, and **Development**

## Step 6: Domain Setup (When Ready)

1. Go to **Project Settings** > **Domains**
2. Add the following custom domains:

| Domain | Purpose |
|--------|---------|
| `bunyan.io` | Main marketing site / landing page |
| `app.bunyan.io` | Dashboard (mosque admin panel) |
| `give.bunyan.io` | QR code redirect URLs for donations |
| `*.bunyan.io` | Wildcard for tenant subdomains (if needed later) |

3. For each domain, Vercel will provide DNS records to add at your domain registrar
4. Point your domain's nameservers to Vercel (recommended) or add individual DNS records
5. SSL certificates are provisioned automatically by Vercel

---

**Summary:** You now have a Vercel project linked to the Bunyan GitHub repo, deploying to the Amsterdam region. Domains and environment variables will be configured when we're ready to go live.
