type PlanLimits = {
  maxFunds: number | null
  maxOnlineDonations: number | null
  maxAdmins: number | null
  hasDonorCRM: boolean
  hasAnbi: boolean
  hasRecurring: boolean
  hasQR: boolean
  hasCampaigns: boolean
  hasCsvExport: boolean
  hasMemberIntelligence: boolean
  hasMemberSegments: boolean
  hasMemberAlerts: boolean
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxFunds: 1,
    maxOnlineDonations: 15,
    maxAdmins: 1,
    hasDonorCRM: false,
    hasAnbi: false,
    hasRecurring: false,
    hasQR: false,
    hasCampaigns: false,
    hasCsvExport: false,
    hasMemberIntelligence: false,
    hasMemberSegments: false,
    hasMemberAlerts: false,
  },
  starter: {
    maxFunds: null,
    maxOnlineDonations: null,
    maxAdmins: 2,
    hasDonorCRM: true,
    hasAnbi: true,
    hasRecurring: true,
    hasQR: true,
    hasCampaigns: true,
    hasCsvExport: false,
    hasMemberIntelligence: true,
    hasMemberSegments: false,
    hasMemberAlerts: false,
  },
  growth: {
    maxFunds: null,
    maxOnlineDonations: null,
    maxAdmins: null,
    hasDonorCRM: true,
    hasAnbi: true,
    hasRecurring: true,
    hasQR: true,
    hasCampaigns: true,
    hasCsvExport: true,
    hasMemberIntelligence: true,
    hasMemberSegments: true,
    hasMemberAlerts: true,
  },
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}
