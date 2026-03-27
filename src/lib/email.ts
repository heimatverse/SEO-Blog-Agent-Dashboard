import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? "onboarding@resend.dev"
const APP_NAME = "SEO Blog Agent"

export async function sendOtpEmail(to: string, code: string, name?: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${code} is your ${APP_NAME} verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;font-size:20px">${APP_NAME}</h2>
        <p style="color:#666;margin:0 0 24px">Hi ${name ?? "there"},</p>
        <p style="color:#666;margin:0 0 16px">Your verification code is:</p>
        <div style="background:#f4f4f5;border-radius:8px;padding:20px 24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace">${code}</span>
        </div>
        <p style="color:#999;font-size:13px;margin:0">This code expires in <strong>10 minutes</strong> and can only be used once.</p>
        <p style="color:#999;font-size:13px;margin:8px 0 0">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
