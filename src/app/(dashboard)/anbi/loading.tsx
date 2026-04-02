import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AnbiLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-1 h-4 w-80" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-[#e3dfd5] pb-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-8 border-b pb-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-8 border-b pb-3 last:border-0">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
