import { escapeHtml } from "@/lib/escape-html";
import { emailLayout } from "./layout";

interface WebhookAlertParams {
  eventType: string;
  errorMessage: string;
  eventId?: string;
}

export function webhookAlertEmail(params: WebhookAlertParams): string {
  const { eventType, errorMessage, eventId } = params;
  const timestamp = new Date().toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
  });

  const body = `
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
                Webhook verwerkingsfout
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46; line-height: 1.6;">
                Er is een fout opgetreden bij het verwerken van een Stripe webhook event.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 6px; margin-bottom: 24px; border: 1px solid #fecaca;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a; width: 120px;">Event type</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${escapeHtml(eventType)}</td>
                      </tr>
                      ${
                        eventId
                          ? `<tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Event ID</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500; font-family: monospace; font-size: 13px;">${escapeHtml(eventId)}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a;">Tijdstip</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #18181b; font-weight: 500;">${timestamp}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #71717a; vertical-align: top;">Fout</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #991b1b; font-weight: 500; font-family: monospace; font-size: 13px; word-break: break-all;">${escapeHtml(errorMessage)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                Controleer de server logs voor meer details. Dit event wordt mogelijk opnieuw aangeboden door Stripe.
              </p>`;

  return emailLayout({ title: "Webhook fout — Bunyan", body });
}
