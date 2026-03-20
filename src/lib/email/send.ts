import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'Bunyan <noreply@bunyan.nl>'

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  // Skip sending if no API key configured (local dev)
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Skip] To: ${params.to}, Subject: ${params.subject}`)
    return { success: true, skipped: true }
  }

  const { data, error } = await resend.emails.send({
    from: params.from || FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })

  if (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }

  return { success: true, data }
}
