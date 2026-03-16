export type MosquePlan = 'free' | 'starter' | 'growth'
export type UserRole = 'admin' | 'treasurer' | 'viewer'
export type DonationMethod = 'ideal' | 'card' | 'sepa' | 'cash' | 'bank_transfer' | 'stripe'
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'
export type RecurringStatus = 'active' | 'paused' | 'cancelled'
export type Locale = 'nl' | 'en' | 'tr' | 'ar'

export interface Mosque {
  id: string
  name: string
  slug: string
  city: string | null
  address: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  welcome_msg: string | null
  anbi_status: boolean
  rsin: string | null
  kvk: string | null
  language: Locale
  stripe_account_id: string | null
  stripe_customer_id: string | null
  plan: MosquePlan
  plan_started_at: string | null
  created_at: string
  updated_at: string
}

export interface PublicMosque {
  id: string
  name: string
  slug: string
  city: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  welcome_msg: string | null
  anbi_status: boolean
  rsin: string | null
  language: Locale
}

export type TeamMemberStatus = 'active' | 'pending'

export interface User {
  id: string
  mosque_id: string
  name: string
  email: string
  role: UserRole
  invited_at: string | null
  invited_by: string | null
  created_at: string
}

export interface TeamMember extends User {
  status: TeamMemberStatus
}

export interface Fund {
  id: string
  mosque_id: string
  name: string
  description: string | null
  icon: string | null
  goal_amount: number | null
  goal_deadline: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Donor {
  id: string
  mosque_id: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  iban_hint: string | null
  tags: string[]
  total_donated: number
  donation_count: number
  first_donated_at: string | null
  last_donated_at: string | null
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  mosque_id: string
  donor_id: string | null
  fund_id: string
  amount: number
  fee_covered: number
  currency: string
  method: DonationMethod
  status: DonationStatus
  is_recurring: boolean
  recurring_id: string | null
  stripe_payment_intent_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Recurring {
  id: string
  mosque_id: string
  donor_id: string
  fund_id: string
  amount: number
  frequency: RecurringFrequency
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: RecurringStatus
  next_charge_at: string | null
  cancel_token: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  mosque_id: string
  fund_id: string
  title: string
  description: string | null
  slug: string
  goal_amount: number | null
  start_date: string | null
  end_date: string | null
  banner_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AnbiReceipt {
  id: string
  mosque_id: string
  donor_id: string
  year: number
  total_amount: number
  fund_breakdown: Record<string, number>
  receipt_number: string | null
  pdf_url: string | null
  emailed_at: string | null
  created_at: string
}

export interface PeriodicGiftAgreement {
  id: string
  mosque_id: string
  donor_id: string
  annual_amount: number
  fund_id: string | null
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QrLink {
  id: string
  mosque_id: string
  code: string
  fund_id: string | null
  campaign_id: string | null
  scan_count: number
  created_at: string
}

// ---- Member Intelligence ----

export type MemberStatus = 'periodic' | 'active' | 'lapsed' | 'inactive' | 'anonymous' | 'identified'
export type ChurnRisk = 'low' | 'medium' | 'high'
export type DonationFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular'
export type MemberEventType =
  | 'donation'
  | 'recurring_started'
  | 'recurring_cancelled'
  | 'periodic_signed'
  | 'periodic_expired'
  | 'receipt_sent'
  | 'tag_added'

export interface Household {
  id: string
  mosque_id: string
  name: string
  created_at: string
}

export interface MemberEvent {
  id: string
  mosque_id: string
  donor_id: string
  event_type: MemberEventType
  event_data: Record<string, unknown>
  created_at: string
}

export interface MemberStats {
  total_donors: number
  active: number
  lapsed: number
  inactive: number
  anonymous: number
  with_periodic: number
  with_recurring: number
  avg_donation: number
  total_donated_all_time: number
  high_churn_risk: number
}

export interface AuditLogEntry {
  id: string
  mosque_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
}
