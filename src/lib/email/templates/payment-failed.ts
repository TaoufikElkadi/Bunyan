import { formatMoney } from "@/lib/money";
import { escapeHtml } from "@/lib/escape-html";
import { emailLayout } from "./layout";

interface PaymentFailedParams {
  mosqueName: string;
  donorName?: string;
  amount: number; // cents
  frequency: string;
  fundName: string;
  failedCount: number;
  updatePaymentUrl?: string;
}

export function paymentFailedEmail(params: PaymentFailedParams): string {
  const {
    mosqueName,
    donorName,
    amount,
    frequency,
    fundName,
    failedCount,
    updatePaymentUrl,
  } = params;
  const formattedAmount = formatMoney(amount);

  const greeting = donorName
    ? `Beste ${escapeHtml(donorName)}`
    : "Beste donateur";

  const frequencyLabel: Record<string, string> = {
    weekly: "wekelijkse",
    monthly: "maandelijkse",
    yearly: "jaarlijkse",
  };

  const freqText = frequencyLabel[frequency] || escapeHtml(frequency);

  const urgencyNote =
    failedCount >= 3
      ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #dc2626; line-height: 1.6;">
        Let op: uw donatie wordt automatisch stopgezet als de betaling niet slaagt.
      </p>`
      : "";

  const updateButton = updatePaymentUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
        <tr>
          <td style="background-color: #18181b; border-radius: 6px;">
            <a href="${escapeHtml(updatePaymentUrl)}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">
              Betaalmethode bijwerken
            </a>
          </td>
        </tr>
      </table>`
    : "";

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${escapeHtml(mosqueName)}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${greeting},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Uw ${freqText} donatie van ${formattedAmount} aan ${escapeHtml(fundName)} kon niet worden ge&iuml;nd. Stripe zal de betaling automatisch opnieuw proberen.
              </p>
              ${urgencyNote}

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
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${escapeHtml(fundName)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${updateButton}

              <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                Controleer of uw betaalmethode geldig is en voldoende saldo heeft. Neem contact op met uw moskee als u vragen heeft.
              </p>`;

  return emailLayout({
    title: `Betaling mislukt - ${escapeHtml(mosqueName)}`,
    body,
  });
}
