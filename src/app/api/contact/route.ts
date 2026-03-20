import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Naam, e-mail en bericht zijn verplicht." },
        { status: 400 }
      )
    }

    const html = `
      <h2>Nieuw contactformulier bericht via bunyan.nl</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Naam</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:600;">E-mail</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Telefoon</td><td>${phone ? escapeHtml(phone) : "—"}</td></tr>
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e3dfd5;" />
      <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(message)}</p>
    `

    await sendEmail({
      to: "info@bunyan.nl",
      subject: `Contactformulier: ${name}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    )
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
