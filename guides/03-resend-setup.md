# Resend Setup Guide

**When to do this:** Before starting Phase 2 (Core Donation Flow). Can wait until then.

---

## Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click **Get Started**
3. Sign up with GitHub or email
4. Free tier includes: **100 emails/day, 1 custom domain** -- plenty for development

## Step 2: Add and Verify Your Domain

1. In the Resend Dashboard, go to **Domains** (left sidebar)
2. Click **Add Domain**
3. Enter: **bunyan.io**
4. Resend will show you DNS records to add. Go to your domain registrar (where you bought bunyan.io) and add:
   - **MX record** -- for receiving bounces
   - **TXT record (SPF)** -- authorizes Resend to send on your behalf
   - **CNAME records (DKIM)** -- email authentication signatures
5. Back in Resend, click **Verify**
6. DNS propagation can take a few minutes to a few hours
7. Once verified, the domain status will show a green checkmark

## Step 3: Create an API Key

1. In the Resend Dashboard, go to **API Keys** (left sidebar)
2. Click **Create API Key**
3. Name: **Bunyan Development** (you can create separate keys for staging/production later)
4. Permission: **Full access** (for now)
5. Click **Add**
6. Copy the API key immediately -- it's only shown once

## Step 4: Store Credentials

Save in your password manager:

| Label | Value |
|-------|-------|
| Resend API Key (Dev) | `re_...` |

---

**Summary:** You now have a Resend account with bunyan.io verified for sending emails. The free tier is enough for development and early testing.
