import { escapeHtml } from "@/lib/escape-html";
import { formatMoney } from "@/lib/money";
import { emailLayout } from "./layout";

interface PaymentActionRequiredParams {
  mosqueName: string;
  donorName?: string;
  amount: number; // cents
  hostedInvoiceUrl: string;
}

export function paymentActionRequiredEmail(
  params: PaymentActionRequiredParams,
): string {
  const { mosqueName, donorName, amount, hostedInvoiceUrl } = params;
  const formattedAmount = formatMoney(amount);

  const greeting = donorName
    ? `Beste ${escapeHtml(donorName)}`
    : "Beste donateur";

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${escapeHtml(mosqueName)}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${greeting},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Uw bank vereist extra verificatie voor uw donatie van ${formattedAmount} aan ${escapeHtml(mosqueName)}.
                Klik op de onderstaande knop om de betaling te voltooien.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background-color: #18181b; border-radius: 6px;">
                    <a href="${escapeHtml(hostedInvoiceUrl)}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Betaling voltooien
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                Deze verificatie is vereist door uw bank voor uw veiligheid. Als u deze donatie niet herkent, kunt u dit bericht negeren.
              </p>`;

  return emailLayout({
    title: `Actie vereist voor uw donatie - ${escapeHtml(mosqueName)}`,
    body,
  });
}
