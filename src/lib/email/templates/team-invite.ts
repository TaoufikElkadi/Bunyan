import { emailLayout } from './layout'

interface TeamInviteParams {
  mosqueName: string
  inviterName: string
  role: string
  signupUrl: string
}

const roleDescriptions: Record<string, string> = {
  admin: 'Beheerder — volledige toegang tot alle instellingen en gegevens',
  treasurer: 'Penningmeester — toegang tot donaties, rapporten en financieel beheer',
  viewer: 'Bekijker — alleen-lezen toegang tot het dashboard',
}

export function teamInviteEmail(params: TeamInviteParams): string {
  const { mosqueName, inviterName, role, signupUrl } = params

  const roleDescription = roleDescriptions[role] || role

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${mosqueName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Beste,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${inviterName} heeft u uitgenodigd voor <strong>${mosqueName}</strong> op Bunyan.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                Uw rol: <strong>${roleDescription}</strong>
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #18181b;">
                    <a href="${signupUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Uitnodiging accepteren
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                Of kopieer deze link in uw browser:<br />
                <a href="${signupUrl}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${signupUrl}</a>
              </p>`

  return emailLayout({ title: `Uitnodiging voor ${mosqueName} - Bunyan`, body })
}
