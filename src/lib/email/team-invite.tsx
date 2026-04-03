import { sendEmail } from './send'
import { teamInviteEmail } from './templates/team-invite'

interface TeamInviteEmailProps {
  to: string
  name: string
  mosqueName: string
  inviterName: string
  role: string
  inviteUrl: string
}

/**
 * Send a team invite email via Resend.
 * Team invites come from the platform (not the mosque),
 * so we use the default Bunyan sender.
 */
export async function sendTeamInviteEmail(props: TeamInviteEmailProps) {
  const { to, mosqueName, inviterName, role, inviteUrl } = props

  return sendEmail({
    to,
    subject: `${inviterName} heeft u uitgenodigd voor ${mosqueName}`,
    html: teamInviteEmail({ mosqueName, inviterName, role, signupUrl: inviteUrl }),
  })
}
