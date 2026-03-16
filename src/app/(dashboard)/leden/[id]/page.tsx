import { getCachedProfile } from '@/lib/supabase/cached'
import { formatMoney } from '@/lib/money'
import { computeMemberStatus, computeChurnRisk, daysSince } from '@/lib/member-status'
import { MemberStatusBadge } from '@/components/members/member-status-badge'
import { ChurnRiskIndicator } from '@/components/members/churn-risk-indicator'
import { MemberTimeline } from '@/components/members/member-timeline'
import { MemberNotes } from '@/components/members/member-notes'
import { DonorEditDialog } from '@/components/donor/donor-edit-dialog'
import { ArrowLeftIcon, PencilIcon, Repeat, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { MemberEvent } from '@/types'

export const revalidate = 60

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
  quarterly: 'Per kwartaal',
  yearly: 'Jaarlijks',
  irregular: 'Onregelmatig',
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { mosqueId, supabase } = await getCachedProfile()
  if (!mosqueId) return null

  const { id } = await params

  const [{ data: donor }, { data: recurrings }, { data: periodics }, { data: events }] =
    await Promise.all([
      supabase
        .from('donors')
        .select('*, households(id, name)')
        .eq('id', id)
        .eq('mosque_id', mosqueId)
        .single(),
      supabase
        .from('recurrings')
        .select('id, status, amount, frequency')
        .eq('donor_id', id)
        .eq('mosque_id', mosqueId),
      supabase
        .from('periodic_gift_agreements')
        .select('id, status, annual_amount, start_date, end_date')
        .eq('donor_id', id)
        .eq('mosque_id', mosqueId),
      supabase
        .from('member_events')
        .select('*')
        .eq('donor_id', id)
        .eq('mosque_id', mosqueId)
        .order('created_at', { ascending: false })
        .limit(30),
    ])

  if (!donor) notFound()

  const hasActiveRecurring = (recurrings ?? []).some((r) => r.status === 'active')
  const hasActivePeriodic = (periodics ?? []).some((p) => p.status === 'active')
  const activeRecurring = (recurrings ?? []).find((r) => r.status === 'active')
  const activePeriodic = (periodics ?? []).find((p) => p.status === 'active')

  const input = {
    email: donor.email,
    name: donor.name,
    last_donated_at: donor.last_donated_at,
    has_active_recurring: hasActiveRecurring,
    has_active_periodic: hasActivePeriodic,
  }

  const memberStatus = computeMemberStatus(input)
  const churnRisk = computeChurnRisk(input)
  const daysLast = daysSince(donor.last_donated_at)

  const avgDonation = donor.avg_donation_amount > 0
    ? donor.avg_donation_amount
    : donor.donation_count > 0
      ? Math.round(donor.total_donated / donor.donation_count)
      : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/leden" className="mt-1.5">
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3dfd5] bg-white text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
            <ArrowLeftIcon className="size-4" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] sm:text-[28px] font-bold tracking-[-0.5px] text-[#261b07] break-words">
            {donor.name ?? 'Anoniem'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <MemberStatusBadge status={memberStatus} />
            <ChurnRiskIndicator risk={churnRisk} />
          </div>
          <p className="text-[13px] text-[#8a8478] mt-1">
            Lid sinds {donor.created_at
              ? new Date(donor.created_at).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
              : '-'}
            {daysLast !== null && (
              <span className="text-[#b5b0a5]">
                {' '}· {daysLast}d geleden
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats row — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Totaal" value={formatMoney(donor.total_donated)} />
        <StatCard label="Gem. gift" value={formatMoney(avgDonation)} />
        <StatCard label="Frequentie" value={FREQUENCY_LABELS[donor.donation_frequency] ?? '-'} />
        <StatCard label="Geschat/jaar" value={donor.estimated_annual ? formatMoney(donor.estimated_annual) : '-'} />
      </div>

      {/* Active subscriptions — horizontal on mobile */}
      {(activeRecurring || activePeriodic) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeRecurring && (
            <div className="rounded-xl border border-[#e0edff] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="h-4 w-4 text-[#2563eb]" strokeWidth={1.5} />
                <span className="text-[12px] font-semibold text-[#261b07]">Actief terugkerend</span>
              </div>
              <p className="text-[18px] font-bold text-[#261b07]">
                {formatMoney(activeRecurring.amount)}
                <span className="text-[12px] font-normal text-[#8a8478]">
                  /{activeRecurring.frequency === 'monthly' ? 'maand' : activeRecurring.frequency === 'weekly' ? 'week' : 'jaar'}
                </span>
              </p>
            </div>
          )}
          {activePeriodic && (
            <div className="rounded-xl border border-[#ede9fe] bg-[#faf8ff] p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-[#7c3aed]" strokeWidth={1.5} />
                <span className="text-[12px] font-semibold text-[#261b07]">Periodieke gift</span>
              </div>
              <p className="text-[18px] font-bold text-[#261b07]">
                {formatMoney(activePeriodic.annual_amount)}
                <span className="text-[12px] font-normal text-[#8a8478]">/jaar</span>
              </p>
              <p className="text-[11px] text-[#8a8478] mt-0.5">
                {new Date(activePeriodic.start_date).toLocaleDateString('nl-NL')} — {new Date(activePeriodic.end_date).toLocaleDateString('nl-NL')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main content — stacks on mobile, side-by-side on lg */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column: info + notes */}
        <div className="lg:col-span-1 space-y-5">
          {/* Contact info */}
          <div className="rounded-xl border border-[#e3dfd5] bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[#261b07]">Gegevens</h3>
              <DonorEditDialog
                donor={donor}
                trigger={
                  <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[#e3dfd5] bg-white text-[12px] font-medium text-[#8a8478] hover:bg-[#f3f1ec] hover:text-[#261b07] transition-colors">
                    <PencilIcon className="size-3" />
                    Bewerken
                  </button>
                }
              />
            </div>
            <div className="space-y-3 text-[13px]">
              <InfoRow label="E-mail" value={donor.email} />
              <InfoRow label="Telefoon" value={donor.phone} />
              <InfoRow label="Adres" value={donor.address} />
              {donor.iban_hint && <InfoRow label="IBAN" value={`****${donor.iban_hint}`} mono />}
              {donor.tags?.length > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#a09888] shrink-0">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {donor.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-[#f3f1ec] px-2 py-0.5 text-[11px] font-medium text-[#261b07]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {donor.households && (
                <InfoRow label="Huishouden" value={donor.households.name} />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-[#e3dfd5] bg-white p-5">
            <h3 className="text-[14px] font-semibold text-[#261b07] mb-3">Notities</h3>
            <MemberNotes donorId={donor.id} initialNotes={donor.notes} />
          </div>
        </div>

        {/* Right column: Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#e3dfd5] bg-white p-5">
            <h3 className="text-[14px] font-semibold text-[#261b07] mb-4">Activiteit</h3>
            {(events ?? []).length > 0 ? (
              <MemberTimeline events={(events ?? []) as MemberEvent[]} />
            ) : (
              <div className="flex flex-col items-center py-10">
                <Users className="h-6 w-6 text-[#b5b0a5] mb-2" strokeWidth={1.5} />
                <p className="text-[12px] text-[#a09888] text-center">
                  Nog geen activiteit geregistreerd voor dit lid.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e3dfd5] bg-white p-3 sm:p-4">
      <p className="text-[10px] sm:text-[11px] font-medium text-[#a09888] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[16px] sm:text-[18px] font-bold text-[#261b07] tracking-tight truncate">{value}</p>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#a09888] shrink-0">{label}</span>
      <span className={`font-medium text-[#261b07] text-right truncate ${mono ? 'font-mono' : ''}`}>
        {value ?? '-'}
      </span>
    </div>
  )
}
