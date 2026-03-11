import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Bunyan
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Alles-in-één donatiebeheer voor moskeeën
        </p>
        <p className="mt-2 text-muted-foreground">
          Ontvang donaties, beheer donateurs en genereer ANBI-giftenverklaringen — allemaal in één platform.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" render={<Link href="/signup" />}>
            Gratis starten
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/login" />}>
            Inloggen
          </Button>
        </div>
      </div>
    </div>
  )
}
