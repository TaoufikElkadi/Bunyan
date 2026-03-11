import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AnbiPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ANBI Jaaroverzicht</h1>

      <Card>
        <CardHeader>
          <CardTitle>Giftenverklaringen genereren</CardTitle>
          <CardDescription>
            Genereer ANBI-conforme giftenverklaringen voor uw donateurs per kalenderjaar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Deze functionaliteit wordt beschikbaar in een volgende versie.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
