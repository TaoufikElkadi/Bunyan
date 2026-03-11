import { Card, CardContent } from '@/components/ui/card'

export default function LoginLoading() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </CardContent>
    </Card>
  )
}
