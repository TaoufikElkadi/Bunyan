import { AlertCircle } from 'lucide-react'

type Props = {
  mosqueName: string
  logoUrl: string | null
  primaryColor: string
}

export function StripeNotConnected({ mosqueName, logoUrl, primaryColor }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        {logoUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={mosqueName}
            className="mx-auto mb-6 h-16 w-16 rounded-2xl object-cover"
          />
        )}
        <h1
          className="text-[20px] font-bold tracking-tight"
          style={{ color: primaryColor }}
        >
          {mosqueName}
        </h1>
        <div className="mx-auto mt-6 rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-[0_1px_3px_rgba(38,27,7,0.06)]">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <AlertCircle className="h-6 w-6" style={{ color: primaryColor }} strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-medium text-[#261b07] leading-relaxed">
            Deze moskee is nog bezig met het instellen van online betalingen.
          </p>
          <p className="mt-2 text-[13px] text-[#a09888] leading-relaxed">
            Neem contact op met de moskee voor meer informatie.
          </p>
        </div>
      </div>
    </div>
  )
}
