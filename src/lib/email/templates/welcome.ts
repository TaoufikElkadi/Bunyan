import { escapeHtml } from "@/lib/escape-html";
import { emailLayout } from "./layout";

interface WelcomeEmailParams {
  name: string;
  mosqueName: string;
  donationUrl: string;
  dashboardUrl: string;
}

export function welcomeEmail(params: WelcomeEmailParams): string {
  const { name, mosqueName, donationUrl, dashboardUrl } = params;

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                Welkom bij Bunyan!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Beste ${escapeHtml(name)},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Gefeliciteerd! <strong>${escapeHtml(mosqueName)}</strong> is succesvol aangemeld op Bunyan.
                Uw donatiepagina is klaar:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${donationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                      Bekijk uw donatiepagina
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #18181b;">
                Volgende stappen
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
                          <strong>1. Koppel uw Stripe-account</strong><br />
                          Verbind Stripe om betalingen te ontvangen.
                          <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: underline;">Ga naar instellingen</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; border-top: 1px solid #e4e4e7;">
                          <strong>2. Nodig uw team uit</strong><br />
                          Voeg bestuursleden toe om samen donaties te beheren.
                          <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: underline;">Ga naar instellingen</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #3f3f46; line-height: 1.6; border-top: 1px solid #e4e4e7;">
                          <strong>3. Deel uw donatiepagina</strong><br />
                          Deel de link met uw gemeenschap:
                          <a href="${donationUrl}" style="color: #2563eb; text-decoration: underline;">${donationUrl}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                Vragen? Neem contact op via <a href="mailto:info@bunyan.nl" style="color: #2563eb; text-decoration: underline;">info@bunyan.nl</a>
              </p>`;

  return emailLayout({
    title: `Welkom bij Bunyan - ${escapeHtml(mosqueName)}`,
    body,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  mosqueName: string;
  donationUrl: string;
  dashboardUrl: string;
}) {
  const { sendEmail } = await import("../send");

  return sendEmail({
    to: params.to,
    subject: `Welkom bij Bunyan, ${params.mosqueName}!`,
    html: welcomeEmail({
      name: params.name,
      mosqueName: params.mosqueName,
      donationUrl: params.donationUrl,
      dashboardUrl: params.dashboardUrl,
    }),
  });
}
