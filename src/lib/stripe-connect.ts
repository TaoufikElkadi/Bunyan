import { stripe } from './stripe'
import { createAdminClient } from './supabase/admin'

/**
 * Looks up a mosque's Stripe Connect account ID.
 * Returns null if the mosque hasn't connected Stripe yet.
 */
export async function getConnectedAccountId(mosqueId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('mosques')
    .select('stripe_account_id, stripe_connected_at')
    .eq('id', mosqueId)
    .single()

  // Only return the account if onboarding is complete (stripe_connected_at is set)
  if (!data?.stripe_account_id || !data?.stripe_connected_at) return null
  return data.stripe_account_id
}

/**
 * Checks a Connect account's status directly from Stripe.
 * Returns a structured status object.
 */
export async function getConnectAccountStatus(stripeAccountId: string) {
  const account = await stripe.accounts.retrieve(stripeAccountId)

  return {
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    requirements: account.requirements,
  }
}

/**
 * Builds the Stripe Connect params for destination charges.
 * Returns empty object if mosque has no connected account (graceful fallback).
 */
export async function buildTransferParams(mosqueId: string): Promise<{
  transfer_data?: { destination: string }
}> {
  const accountId = await getConnectedAccountId(mosqueId)
  if (!accountId) return {}

  return {
    transfer_data: { destination: accountId },
  }
}
