import { Skeleton } from '@/components/ui/skeleton'

export default function LedenLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e3dfd5] bg-white overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="px-6 space-y-4">
          {/* Header row */}
          <div className="flex gap-6 border-b border-[#e3dfd5] pb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-6 border-b border-[#e3dfd5]/60 pb-3 last:border-0">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
