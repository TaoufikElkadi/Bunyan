import { formatMoney } from '@/lib/money'
import { emailLayout } from './layout'

interface AnbiReceiptParams {
  mosqueName: string
  donorName: string
  year: number
  totalAmount: number // cents
}

export function anbiReceiptEmail(params: AnbiReceiptParams): string {
  const { mosqueName, donorName, year, totalAmount } = params
  const formattedAmount = formatMoney(totalAmount)

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${mosqueName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Beste ${donorName},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Hierbij ontvangt u uw jaaroverzicht giften ${year} van ${mosqueName}.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a; width: 120px;">Jaar</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${year}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Totaalbedrag</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                De giftenverklaring is bijgevoegd als PDF.
              </p>
              <p style="margin: 0 0 0 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Bewaar dit document voor uw belastingaangifte.
              </p>`

  return emailLayout({ title: `Jaaroverzicht giften ${year} - ${mosqueName}`, body })
}
