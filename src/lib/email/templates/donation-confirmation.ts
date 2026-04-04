import { formatMoney } from "@/lib/money";
import { escapeHtml } from "@/lib/escape-html";
import { emailLayout } from "./layout";

interface DonationConfirmationParams {
  mosqueName: string;
  donorName?: string;
  amount: number; // cents
  fundName: string;
  method: string;
  date: string;
  isRecurring: boolean;
  frequency?: string;
  cancelUrl?: string;
}

export function donationConfirmationEmail(
  params: DonationConfirmationParams,
): string {
  const {
    mosqueName,
    donorName,
    amount,
    fundName,
    method,
    date,
    isRecurring,
    frequency,
    cancelUrl,
  } = params;

  const greeting = donorName
    ? `Beste ${escapeHtml(donorName)}`
    : "Beste donateur";
  const formattedAmount = formatMoney(amount);

  const frequencyLabel: Record<string, string> = {
    monthly: "maandelijks",
    quarterly: "per kwartaal",
    yearly: "jaarlijks",
  };

  const recurringSection = isRecurring
    ? `
              <tr>
                <td style="padding: 12px 0 0 0;">
                  <p style="margin: 0; font-size: 14px; color: #3f3f46; line-height: 1.6;">
                    Dit is een <strong>${frequencyLabel[frequency || "monthly"] || escapeHtml(frequency || "")}</strong> doorlopende donatie.
                  </p>
                  ${
                    cancelUrl
                      ? `
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #3f3f46; line-height: 1.6;">
                    U kunt uw doorlopende donatie op elk moment stopzetten via
                    <a href="${cancelUrl}" style="color: #2563eb; text-decoration: underline;">deze link</a>.
                  </p>`
                      : ""
                  }
                </td>
              </tr>`
    : "";

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                ${escapeHtml(mosqueName)}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                ${greeting},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Bedankt voor uw donatie van <strong>${formattedAmount}</strong> aan ${escapeHtml(fundName)} bij ${escapeHtml(mosqueName)}.
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
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Fonds</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${escapeHtml(fundName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Betaalmethode</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${method}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Datum</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${recurringSection}`;

  return emailLayout({
    title: `Donatiebevestiging - ${escapeHtml(mosqueName)}`,
    body,
  });
}
