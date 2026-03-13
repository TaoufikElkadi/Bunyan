import { getCachedProfile } from '@/lib/supabase/cached'
import { QRManagement } from '@/components/qr/qr-management'

export const revalidate = 60

export default async function QRPage() {
  const { mosqueId, supabase } = await getCachedProfile()

  if (!mosqueId) return null

  const [{ data: funds }, { data: campaigns }] = await Promise.all([
    supabase
      .from('funds')
      .select('id, name')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('campaigns')
      .select('id, title')
      .eq('mosque_id', mosqueId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">QR-codes</h1>
        <p className="text-muted-foreground mt-1">Maak en beheer donatie QR-codes</p>
      </div>
      <QRManagement
        funds={funds || []}
        campaigns={campaigns || []}
      />
    </div>
  )
}
