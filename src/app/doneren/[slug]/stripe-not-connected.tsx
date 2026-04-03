import { AlertCircle, MailIcon } from 'lucide-react'

type Props = {
  mosqueName: string
  logoUrl: string | null
  primaryColor: string
  contactEmail?: string | null
}

export function StripeNotConnected({ mosqueName, logoUrl, primaryColor, contactEmail }: Props) {
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
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ background: `${primaryColor}10`, color: primaryColor }}
            >
              <MailIcon className="h-4 w-4" />
              {contactEmail}
            </a>
          ) : (
            <p className="mt-2 text-[13px] text-[#a09888] leading-relaxed">
              Neem contact op met de moskee via hun website of sociale media.
            </p>
          )}
        </div>

        <div className="mt-8 text-[11px] text-[#b5ac98]">
          <span>Powered by </span>
          <a href="https://bunyan.nl" className="underline hover:text-[#9B8E7B]">Bunyan</a>
          <span> · </span>
          <a href="mailto:info@bunyan.nl" className="underline hover:text-[#9B8E7B]">info@bunyan.nl</a>
        </div>
      </div>
    </div>
  )
}
