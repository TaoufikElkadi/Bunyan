-- Fix: Set search_path on all public functions to prevent search_path hijacking
-- Supabase Security Advisor: function_search_path_mutable

ALTER FUNCTION public.generate_anbi_receipt_number(UUID, INTEGER)
  SET search_path = public;

ALTER FUNCTION public.log_donation_member_event()
  SET search_path = public;

ALTER FUNCTION public.log_recurring_member_event()
  SET search_path = public;

ALTER FUNCTION public.log_periodic_gift_member_event()
  SET search_path = public;

ALTER FUNCTION public.get_user_mosque_id()
  SET search_path = public;

ALTER FUNCTION public.log_shard_commitment_event()
  SET search_path = public;

ALTER FUNCTION public.log_shard_payment_event()
  SET search_path = public;

ALTER FUNCTION public.update_donor_aggregates()
  SET search_path = public;

ALTER FUNCTION public.update_updated_at()
  SET search_path = public;

ALTER FUNCTION public.get_fund_totals(UUID)
  SET search_path = public;

ALTER FUNCTION public.get_dashboard_metrics(UUID, TIMESTAMPTZ)
  SET search_path = public;

ALTER FUNCTION public.get_monthly_totals(UUID)
  SET search_path = public;

ALTER FUNCTION public.get_fund_breakdown(UUID, TIMESTAMPTZ)
  SET search_path = public;

ALTER FUNCTION public.increment_plan_usage(UUID, DATE)
  SET search_path = public;

ALTER FUNCTION public.get_user_role()
  SET search_path = public;

ALTER FUNCTION public.get_shard_stats(UUID)
  SET search_path = public;

ALTER FUNCTION public.get_member_stats(UUID)
  SET search_path = public;
