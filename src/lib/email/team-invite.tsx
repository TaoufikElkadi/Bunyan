/**
 * Team invite email template (scaffolded — Resend domain not yet configured).
 *
 * When Resend is ready, import and use:
 *   import { sendTeamInviteEmail } from '@/lib/email/team-invite'
 */

interface TeamInviteEmailProps {
  to: string
  name: string
  mosqueName: string
  inviterName: string
  role: string
  inviteUrl: string
}

/**
 * Send a team invite email. Currently a no-op that logs the URL.
 * Replace with Resend implementation when the domain is configured.
 */
export async function sendTeamInviteEmail(props: TeamInviteEmailProps) {
  const { to, name, mosqueName, inviterName, role, inviteUrl } = props

  // TODO: Replace with actual Resend email when domain is configured
  //
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  //
  // await resend.emails.send({
  //   from: 'Bunyan <noreply@bunyan.io>',
  //   to,
  //   subject: `${inviterName} heeft u uitgenodigd voor ${mosqueName}`,
  //   react: TeamInviteEmailTemplate({ name, mosqueName, inviterName, role, inviteUrl }),
  // })

  console.log(
    `[Email Stub] Team invite email for ${to}:`,
    JSON.stringify({ name, mosqueName, inviterName, role, inviteUrl }, null, 2)
  )
}

/**
 * React Email template for team invites.
 * Scaffolded as a plain HTML string for now.
 */
export function getTeamInviteEmailHtml(props: Omit<TeamInviteEmailProps, 'to'>) {
  const { name, mosqueName, inviterName, role, inviteUrl } = props

  const roleLabel: Record<string, string> = {
    admin: 'Beheerder',
    treasurer: 'Penningmeester',
    viewer: 'Alleen lezen',
  }

  return `
    <!DOCTYPE html>
    <html lang="nl">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>Welkom bij Bunyan</h2>
      <p>Hallo ${name},</p>
      <p>
        ${inviterName} heeft u uitgenodigd om als <strong>${roleLabel[role] ?? role}</strong>
        deel te nemen aan het dashboard van <strong>${mosqueName}</strong>.
      </p>
      <p>
        Klik op de onderstaande knop om uw wachtwoord in te stellen en toegang te krijgen:
      </p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}"
           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Wachtwoord instellen
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Deze link is 24 uur geldig. Als de link is verlopen, vraag dan de beheerder om een nieuwe uitnodiging.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Bunyan — Donatiebeheer voor moskeeën
      </p>
    </body>
    </html>
  `.trim()
}
