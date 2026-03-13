import Link from "next/link"
import { InviteHandler } from "@/components/auth/invite-handler"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <InviteHandler />
      <div className="max-w-2xl text-center px-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          Bunyan
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          Alles-in-één donatiebeheer voor moskeeën
        </p>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Ontvang donaties, beheer donateurs en genereer ANBI-giftenverklaringen — allemaal in één platform.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/signup"
            className="inline-flex min-h-[48px] md:min-h-0 md:h-9 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-6 md:px-4 text-base md:text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Gratis starten
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[48px] md:min-h-0 md:h-9 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-background px-6 md:px-4 text-base md:text-sm font-medium transition-colors hover:bg-muted"
          >
            Inloggen
          </Link>
        </div>
      </div>
    </div>
  )
}
