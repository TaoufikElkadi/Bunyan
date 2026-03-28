import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const DEFAULT_FROM = 'Bunyan <noreply@bunyan.nl>'
const PLATFORM_REPLY_TO = 'info@bunyan.nl'

interface Attachment {
  filename: string
  content: Buffer | Uint8Array
  contentType?: string
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: Attachment[]
}

export async function sendEmail(params: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Skip] To: ${params.to}, Subject: ${params.subject}`)
    return { success: true, skipped: true }
  }

  const { data, error } = await getResend().emails.send({
    from: params.from || DEFAULT_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
    ...(params.attachments && {
      attachments: params.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    }),
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return { success: true, data }
}

/**
 * Sends an email on behalf of a mosque.
 * From: "Mosque Name via Bunyan <noreply@bunyan.nl>"
 * Reply-To: mosque's contact_email or platform fallback
 */
export async function sendMosqueEmail(params: {
  to: string
  subject: string
  html: string
  mosqueName: string
  mosqueContactEmail?: string | null
  attachments?: Attachment[]
}) {
  return sendEmail({
    to: params.to,
    subject: params.subject,
    html: params.html,
    from: `${params.mosqueName} via Bunyan <noreply@bunyan.nl>`,
    replyTo: params.mosqueContactEmail || PLATFORM_REPLY_TO,
    attachments: params.attachments,
  })
}
