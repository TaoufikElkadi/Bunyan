export type PlanTier = "free" | "starter" | "compleet";

type PlanLimits = {
  maxFunds: number | null;
  maxOnlineDonations: number | null;
  maxAdmins: number | null;
  maxActiveCampaigns: number | null;
  maxQRCodes: number | null;
  hasDonorCRM: boolean;
  hasAnbi: boolean;
  hasBulkAnbi: boolean;
  hasRecurring: boolean;
  hasQR: boolean;
  hasCampaigns: boolean;
  hasCsvExport: boolean;
  hasAdvancedExports: boolean;
  hasMemberIntelligence: boolean;
  hasMemberSegments: boolean;
  hasMemberAlerts: boolean;
  hasShard: boolean;
};

type PlanPricing = {
  monthlyPriceCents: number;
  yearlyPriceCents: number;
};

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxFunds: 2,
    maxOnlineDonations: 30,
    maxAdmins: 1,
    maxActiveCampaigns: null,
    maxQRCodes: null,
    hasDonorCRM: false,
    hasAnbi: false,
    hasBulkAnbi: false,
    hasRecurring: false,
    hasQR: false,
    hasCampaigns: false,
    hasCsvExport: false,
    hasAdvancedExports: false,
    hasMemberIntelligence: false,
    hasMemberSegments: false,
    hasMemberAlerts: false,
    hasShard: false,
  },
  starter: {
    maxFunds: 5,
    maxOnlineDonations: null,
    maxAdmins: 3,
    maxActiveCampaigns: 2,
    maxQRCodes: 10,
    hasDonorCRM: true,
    hasAnbi: true,
    hasBulkAnbi: false,
    hasRecurring: true,
    hasQR: true,
    hasCampaigns: true,
    hasCsvExport: true,
    hasAdvancedExports: false,
    hasMemberIntelligence: true,
    hasMemberSegments: false,
    hasMemberAlerts: false,
    hasShard: true,
  },
  compleet: {
    maxFunds: null,
    maxOnlineDonations: null,
    maxAdmins: null,
    maxActiveCampaigns: null,
    maxQRCodes: null,
    hasDonorCRM: true,
    hasAnbi: true,
    hasBulkAnbi: true,
    hasRecurring: true,
    hasQR: true,
    hasCampaigns: true,
    hasCsvExport: true,
    hasAdvancedExports: true,
    hasMemberIntelligence: true,
    hasMemberSegments: true,
    hasMemberAlerts: true,
    hasShard: true,
  },
};

export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  free: {
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
  },
  starter: {
    monthlyPriceCents: 6900,
    yearlyPriceCents: 69000, // €690/yr (2 months free)
  },
  compleet: {
    monthlyPriceCents: 14900,
    yearlyPriceCents: 149000, // €1.490/yr (2 months free)
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanTier] || PLAN_LIMITS.free;
}

export function getPlanPricing(plan: PlanTier): PlanPricing {
  return PLAN_PRICING[plan];
}
