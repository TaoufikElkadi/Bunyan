# Mollie Setup Guide

**When to do this:** Before starting Phase 2 (Core Donation Flow). Can wait until then.

Note: Mollie Connect app review may take a few days, so apply early if possible.

---

## Step 1: Create a Mollie Account

1. Go to [https://www.mollie.com/signup](https://www.mollie.com/signup)
2. Sign up with your email address
3. Confirm your email

## Step 2: Complete Identity Verification

1. In the Mollie Dashboard, you'll be prompted to verify your identity
2. You'll need:
   - Your **KVK number** (Kamer van Koophandel registration)
   - A valid ID document
   - Business bank account details (IBAN)
3. Follow the on-screen steps to complete verification
4. This is required for live (real money) payments but **not** for test mode

## Step 3: Create a Mollie Connect (OAuth) App

This lets mosques connect their own Mollie accounts to Bunyan.

1. In the Mollie Dashboard, go to **Developers** (left sidebar)
2. Click **Your apps** tab
3. Click **Create app**
4. Fill in the app details:
   - App name: **Bunyan**
   - Description: **Donation management platform for mosques**
5. Set the redirect URLs:
   - Production: `https://app.bunyan.io/api/mollie/callback`
   - Development: `http://localhost:3000/api/mollie/callback`
6. Select the required permissions (scopes):
   - `payments.read`
   - `payments.write`
   - `refunds.read`
   - `organizations.read`
   - `mandates.read`
   - `mandates.write`
   - `subscriptions.read`
   - `subscriptions.write`
7. Click **Save**
8. Copy and save in your password manager:
   - **Client ID** -- starts with `app_`
   - **Client Secret**

## Step 4: Test Mode

- Mollie provides **test mode** by default -- no real money is processed
- In the Mollie Dashboard, toggle between **Live** and **Test** mode (top of the page)
- Test API keys are available under **Developers > API keys**
- You can use test mode to verify the full payment flow before going live

## Step 5: Store Credentials

Save in your password manager:

| Label | Value |
|-------|-------|
| Mollie Client ID | `app_...` |
| Mollie Client Secret | (secret) |
| Mollie Test API Key | `test_...` (from API keys page) |
| Mollie Live API Key | `live_...` (from API keys page, after verification) |

---

**Summary:** You now have a Mollie Connect app that mosques can use to connect their Mollie accounts to Bunyan. Test mode is available immediately; live payments require identity verification.
