import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/sanity/lib/client"
import { sendOtpEmail } from "@/lib/email"
import { groq } from "next-sanity"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
    }

    // Look up user in Sanity
    const user = await sanityClient.fetch(
      groq`*[_type == "user" && email == $email][0]{ _id, email, name, passwordHash, isVerified }`,
      { email }
    )

    // Fall back to demo user if Sanity user not found
    const demoEmail = process.env.DEMO_EMAIL ?? "demo@seoblog.ai"
    const demoHash = process.env.DEMO_PASSWORD_HASH ?? ""
    const demoName = process.env.DEMO_NAME ?? "Demo User"
    const isDemoUser = !user && email === demoEmail

    let userName = user?.name ?? demoName
    let passwordHash = user?.passwordHash ?? demoHash

    if (!user && !isDemoUser) {
      // Delay to prevent email enumeration
      await new Promise((r) => setTimeout(r, 500))
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Delete old OTPs for this email
    const oldTokens = await sanityClient.fetch(
      groq`*[_type == "otpToken" && email == $email]{ _id }`,
      { email }
    )
    for (const t of oldTokens) {
      await sanityClient.delete(t._id)
    }

    await sanityClient.create({ _type: "otpToken", email, codeHash, expiresAt, type: "login" })

    // Send OTP
    try {
      await sendOtpEmail(email, code, userName)
    } catch (emailErr) {
      console.error("[send-otp] email send failed:", emailErr)
      const msg = !process.env.RESEND_API_KEY
        ? "Email service not configured — add RESEND_API_KEY to Vercel env vars."
        : "Failed to send verification email. Please try again."
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-otp]", err)
    const msg = err instanceof Error ? err.message : "Failed to send OTP. Please try again."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
