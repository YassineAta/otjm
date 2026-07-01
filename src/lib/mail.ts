// Outbound email via SMTP (nodemailer). Provider-agnostic on purpose: any
// mailbox works (association webmail, Gmail app-password, Brevo/Resend SMTP)
// and switching providers is an env change, not a code change (ADR-005).
//
// Required env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
// Optional:     SMTP_SECURE=1 (implicit TLS, e.g. port 465)
import nodemailer from 'nodemailer'

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.MAIL_FROM,
  )
}

let transporter: nodemailer.Transporter | null = null
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === '1' || Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return transporter
}

export interface CardEmailInput {
  to: string
  fullName: string
  cardNumberLabel: string // e.g. "0007"
  png: Buffer
  pdf: Buffer
}

export async function sendMemberCardEmail(input: CardEmailInput): Promise<void> {
  const subject = `Votre carte de membre OTJM — N° ${input.cardNumberLabel}`
  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2b2b2b">
    <h2 style="color:#8c1f2c">Bienvenue à l'OTJM</h2>
    <p>Bonjour ${escapeHtml(input.fullName)},</p>
    <p>Votre adhésion à l'<strong>Organisation Tunisienne des Jeunes Médecins</strong> est confirmée.
       Vous trouverez en pièce jointe votre carte de membre <strong>N° ${input.cardNumberLabel}</strong>
       (image pour votre téléphone, PDF pour l'impression).</p>
    <p style="direction:rtl;text-align:right">مرحباً بك في المنظمة التونسية للأطباء الشبان — تجدون بطاقة العضوية في المرفقات.</p>
    <p style="color:#6d585a;font-size:13px">أطباء في خدمة الشعب و الوطن — otjm.tn</p>
  </div>`

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: input.to,
    subject,
    html,
    attachments: [
      {
        filename: `carte-otjm-${input.cardNumberLabel}.png`,
        content: input.png,
        contentType: 'image/png',
      },
      {
        filename: `carte-otjm-${input.cardNumberLabel}.pdf`,
        content: input.pdf,
        contentType: 'application/pdf',
      },
    ],
  })
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)
}
