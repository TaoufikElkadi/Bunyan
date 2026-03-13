import { formatMoney } from '@/lib/money'
import { emailLayout } from './layout'

interface RecurringCancelledParams {
  mosqueName: string
  donorName?: string
  amount: number // cents
  frequency: string
  fundName: string
}

export function recurringCancelledEmail(params: RecurringCancelledParams): string {
  const { mosqueName, donorName, amount, frequency, fundName } = params
  const formattedAmount = formatMoney(amount)

  const greeting = donorName ? `Beste ${donorName}` : 'Beste donateur'

  const frequencyLabel: Record<string, string> = {
    monthly: 'maandelijkse',
    quarterly: 'kwartaal',
    yearly: 'jaarlijkse',
  }

  const freqText = frequencyLabel[frequency] || frequency

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${mosqueName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${greeting},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Uw ${freqText} donatie is stopgezet. Hieronder vindt u een overzicht van de opgezegde donatie.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a; width: 120px;">Bedrag</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Frequentie</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${freqText}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Fonds</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${fundName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                U kunt altijd een nieuwe donatie starten via onze donatiepagina.
              </p>`

  return emailLayout({ title: `Donatie stopgezet - ${mosqueName}`, body })
}
